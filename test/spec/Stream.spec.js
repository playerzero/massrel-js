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

  it('fan out items through enumerators', function() {
    var randomItems = Math.ceil( Math.random() * 100 );
    var randomEnums = Math.ceil( Math.random() * 10 );
    var enumerators = [];

    // create enums
    for(var i = 0; i < randomEnums; i++) {
      enumerators.push( jasmine.createSpy('callback '+(i+1)) );
    }

    massrel.Stream.step_through(new Array(randomItems), enumerators, window);

    // check enums
    for(var i = 0; i < randomEnums; i++) {
      expect(enumerators[i].callCount).toEqual(randomItems);
    }
  });

  //TODO: #load, #each, #poller, #meta

});
