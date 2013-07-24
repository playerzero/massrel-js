describe('intents helper', function() {

  it('turn anytype to url', function() {
    var result = massrel.intents.url('fake', {
      key: ['val1', 'val2']
    });
    expect(result).toEqual('https://twitter.com/intent/fake?key=val1,val2');
  });

  it('use secure url', function() {
    var result = massrel.intents.tweet();

    expect(0).toEqual(result.indexOf('https://'));
  });


  it('generate a tweet', function() {
    var result = massrel.intents.tweet({
      text: 'prefill',
      url: 'blah',
      hashtags: 'hashtag',
      via: 'howardr'
    });

    expect(result).toEqual('https://twitter.com/intent/tweet?text=prefill&url=blah&hashtags=hashtag&via=howardr');
  });

  it('gernerate a reply', function() {
    var result = massrel.intents.reply('123456', {
      hashtags: ['awesome']
    });
    expect(result).toEqual('https://twitter.com/intent/tweet?hashtags=awesome&in_reply_to=123456');
  });

  it('generate a retweet', function() {
    var result = massrel.intents.retweet('12345', {
      related: 'howardr'
    });
    expect(result).toEqual('https://twitter.com/intent/retweet?related=howardr&tweet_id=12345');
  });

  it('generate a favorite', function() {
    var result = massrel.intents.favorite('12345', {
      related: 'howardr'
    });
    expect(result).toEqual('https://twitter.com/intent/favorite?related=howardr&tweet_id=12345');
  });

  it('generate a user/profile', function() {
    var result = massrel.intents.user('howardr', {
      related: 'howardr'
    });
    expect(result).toEqual('https://twitter.com/intent/user?related=howardr&screen_name=howardr');

    result = massrel.intents.user('12345', {
      related: 'howardr'
    });
    expect(result).toEqual('https://twitter.com/intent/user?related=howardr&user_id=12345');

    result = massrel.intents.user('22jasontbradshaw');
    expect(result).toEqual('https://twitter.com/intent/user?screen_name=22jasontbradshaw');

    result = massrel.intents.profile('howardr', {
      related: 'howardr'
    });
    expect(result).toEqual('https://twitter.com/intent/user?related=howardr&screen_name=howardr');
  });

});

