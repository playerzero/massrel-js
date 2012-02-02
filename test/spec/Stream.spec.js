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

  it('use correct params from meta options', function() {
    var stream = new massrel.Stream('howardrauscher/test');
    var params;

    params = stream.builMetaParams();
    expect(params.length).toEqual(0);

    params = stream.builMetaParams({});
    expect(params.length).toEqual(0);

    var testParam = function(opts, key, val) {
      var params = stream.builMetaParams(opts);
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam({ disregard: 'word' }, 'disregard', 'word');
  });


  //TODO: #load, #each, #poller, #meta

});
