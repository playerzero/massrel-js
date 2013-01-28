describe('Account', function() {
  var user = 'howardr';

  it('create instance of Account', function() {
    var account = new massrel.Account(user);
    expect(account.user).toEqual(user);
  });

  it('user name should be used when coerced into string', function() {
    var account = new massrel.Account(user);
    expect(String(account)).toEqual(user);
    expect(''+account).toEqual(user);
  });

  it('use correct RESTful urls', function() {
    var account = new massrel.Account(user);
    expect(account.meta_url()).toEqual('http://tweetriver.com/howardr.json');
  });

  it('use correct meta params from options', function() {
    var account = new massrel.Account(user);
    var params;

    params = account.buildMetaParams();
    expect(params.length).toEqual(0);

    params = account.buildMetaParams({});
    expect(params.length).toEqual(0);

    var testParam = function(opts, key, val) {
      var params = account.buildMetaParams(opts);
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam({ quick_stats: true }, 'quick_stats', '1');
    testParam({ streams: 'mystream' }, 'streams', 'mystream');
    testParam({ streams: ['mystream'] }, 'streams', 'mystream');
    testParam({ streams: ['mystream1', 'mystream2'] }, 'streams', 'mystream1,mystream2');
  });

  it('will not break when #meta is called (end-to-end test)', function() {
    var account = new massrel.Account(user);
    var old_request_factory = massrel.helpers.request_factory
    
    var opts = {
      streams: ['mystream'],
      quick_stats: true
    };

    massrel.helpers.request_factory = function(url, params, jsonp_prefix, obj, callback, error) {
      expect(account.meta_url()).toEqual(url);
      expect(account.buildMetaParams(opts)).toEqual(params);
    };
    
    account.meta(opts, function(data) { });

    massrel.helpers.request_factory = old_request_factory;
  });

});
