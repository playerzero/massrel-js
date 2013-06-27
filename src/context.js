define(['helpers'], function(helpers) {

  function Context(status) {
    this.status = status;

    this.source = {
      facebook: false,
      twitter: false,
      getglue: false,
      google: false,
      instagram: false,
      rss: false,
      message: false // from the 'massrelevance' network
    };

    this.known = false;
    this.intents = true;
  }

  Context.create = function (status, opts) {
    status = status || {}; // gracefully handle nulls
    var context = new Context(status);

    opts = helpers.extend(opts || {}, {
      intents: true,
      retweeted_by: true
    });

    context.intents = opts.intents;

    // flag the source in the map if it's a known source
    if (typeof context.source[status.network] !== 'undefined') {
      context.source[status.network] = context.known = true;
    }

    // handle the 'massrelevance' network type
    if (status.network === 'massrelevance') {
      context.source.message = context.known = true;
    }

    // for twitter, pull the retweeted status up and use it as the main status
    if (context.source.twitter && status.retweeted_status && opts.retweeted_by) {
      context.retweet = true;
      context.retweeted_by_user = status.user;
      context.status =  status.retweeted_status;
    }

    return context;
  };

  return Context;
});
