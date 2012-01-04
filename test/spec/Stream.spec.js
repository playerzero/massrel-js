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

  //TODO: #load, #each, #poller, #meta

});
