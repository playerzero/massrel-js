define(['helpers'], function(helpers) {

  var intents = {
    base_url: 'https://twitter.com/intent/',
    params: {
      'text'            : '(string): default text, for tweet/reply',
      'url'             : '(string): prefill url, for tweet/reply',
      'hashtags'        : '(string): hashtag (or list with ,) without #, for tweet/reply',
      'related'         : '(string): screen name (or list with ,) without @, available for all',
      'in_reply_to'     : '(number): tweet id, only for reply',
      'via'             : '(string): screen name without @, tweet/reply',
      'tweet_id'        : '(number): tweet id, for retweet and favorite',
      'screen_name'     : '(string): only for user/profile',
      'user_id'         : '(number): only for user/profile',
      'original_referer': '(string): url to display with related ("www.yahoo.com suggests you follow:")'
    },
    // set an original referer if the current page is
    // iframed and there exists a referer
    original_referer:  window.top !== window.self && document.referrer || null
  };

  intents.url = function(type, options) {
    options = options || {};

    // automatically use the referer if user has not set one
    // and we can safetly determine an original referer
    if(options.original_referer === undefined && intents.original_referer) {
      options.original_referer = intents.original_referer;
    }

    //make sure the original referer has http:// or https:// at the beginning, otherwise twitter will ignore it
    if (options.original_referer.indexOf('http://') !== 0 && options.original_referer.indexOf('https://') !== 0) {
      options.original_referer = 'http://' + options.original_referer;
    }

    var params = [];
    for(var k in options) {
      params.push([k, options[k]]);
    }

    return intents.base_url+encodeURIComponent(type)+'?'+helpers.to_qs(params);
  };

  intents.tweet = function(options) {
    return intents.url('tweet', options);
  };

  intents.reply = function(in_reply_to, options) {
    options = options || {};
    options.in_reply_to = in_reply_to;
    return intents.tweet(options);
  };

  intents.retweet = function(tweet_id, options) {
    options = options || {};
    options.tweet_id = tweet_id;
    return intents.url('retweet', options);
  };

  intents.favorite = function(tweet_id, options) {
    options = options || {};
    options.tweet_id = tweet_id;
    return intents.url('favorite', options);
  };

  intents.user = function(screen_name_or_id, options) {
    options = options || {};

    // if it's an integer number, treat it as an id, else as a screen name
    if(/^\d+$/.test(screen_name_or_id + '')) {
      options.user_id = screen_name_or_id;
    }
    else {
      options.screen_name = screen_name_or_id;
    }
    return intents.url('user', options);
  };
  // alias
  intents.profile = intents.user;

  return intents;
});
