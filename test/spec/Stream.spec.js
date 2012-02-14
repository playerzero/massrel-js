describe('Stream', function() {

  
  it('create with slug OR user and stream name pair', function() {
    var stream = new massrel.Stream('howardrauscher/test');
    expect(stream.account).toEqual('howardrauscher');
    expect(stream.stream_name).toEqual('test');

    var stream = new massrel.Stream('howardrauscher', 'test');
    expect(stream.account).toEqual('howardrauscher');
    expect(stream.stream_name).toEqual('test');

  });

  it('use correct RESTful urls', function() {
    var stream = new massrel.Stream('howardrauscher/test');
    expect(stream.stream_url()).toEqual('http://tweetriver.com/howardrauscher/test.json');
expect(stream.meta_url()).toEqual('http://tweetriver.com/howardrauscher/test/meta.json');
  });

  it('use correct params from options', function() {
    var stream = new massrel.Stream('howardrauscher/test');
    var params;

    params = stream.buildParams();
    expect(params.length).toEqual(0);

    params = stream.buildParams({});
    expect(params.length).toEqual(0);

    var testParam = function(opts, key, val) {
      var params = stream.buildParams(opts);
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam({ limit: 5 }, 'limit', 5);
    testParam({ since_id: '100001' }, 'since_id', '100001');
    testParam({ start: '10001' }, 'start', '10001');
    testParam({ start_id: '10001' }, 'start', '10001');
    testParam({ since_id: '100001', start_id: '20002' }, 'since_id', '100001');
    testParam({ replies: true }, 'replies', '1');
    testParam({ geo_hint: true }, 'geo_hint', '1');
  });

  it('will not break when #load is called (end-to-end test)', function() {
    var stream = new massrel.Stream('howardr/test');
    var old_jsonp_factory = massrel.helpers.jsonp_factory
    
    var opts = {
      limit: Math.floor(Math.random() * 100),
      since_id: Math.floor(Math.random() * 1000000000),
      replies: !!Math.round(Math.random())
    };

    massrel.helpers.jsonp_factory = function(url, params, jsonp_prefix, obj, callback, error) {
      expect(stream.stream_url()).toEqual(url);
      expect(stream.buildParams(opts)).toEqual(params);
    };
    
    stream.load(opts, function(data) { });

    massrel.helpers.jsonp_factory = old_jsonp_factory;
  });

  it('use correct params from meta options', function() {
    var stream = new massrel.Stream('howardrauscher/test');
    var params;

    params = stream.buildMetaParams();
    expect(params.length).toEqual(0);

    params = stream.buildMetaParams({});
    expect(params.length).toEqual(0);

    var testParam = function(opts, key, val) {
      var params = stream.buildMetaParams(opts);
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam({ disregard: 'word' }, 'disregard', 'word');
  });

  it('will not break when #meta is called (end-to-end test)', function() {
    var stream = new massrel.Stream('howardr/test');
    var old_jsonp_factory = massrel.helpers.jsonp_factory
    
    var opts = {};

    massrel.helpers.jsonp_factory = function(url, params, jsonp_prefix, obj, callback, error) {
      expect(stream.meta_url()).toEqual(url);
      expect(stream.buildMetaParams(opts)).toEqual(params);
    };
    
    stream.meta(opts, function(data) { });

    massrel.helpers.jsonp_factory = old_jsonp_factory;
  });

  //TODO: #load, #each, #poller, #meta

});
