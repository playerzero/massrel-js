define(['helpers'], function(helpers) {

  function Context(status) {
    this.status = status;
    this.source = {
      facebook: false,
      twitter: false,
      message: false
    };
    this.known = false;
    this.intents = true;
  }

  Context.create = function(status, opts) {
    status = status || {}; // gracefully handle nulls
    var context = new Context(status);

    opts = helpers.extend(opts || {}, {
      intents: true,
      retweeted_by: true
    });

    this.intents = opts.intents;

    // determine status source
    if(status.id_str && status.text && status.entities) {
      // source: twitter
      context.source.twitter = context.known = true;
    }
    if(status.facebook_id) {
      // source: facebook
      context.source.facebook = true;
      context.known = (typeof(status.message) === 'string');
    }
    else if(status.network === 'massrelevance') {
      // source: internal message
      context.source.message = context.known = true;
    }

    if(context.source.twitter && status.retweeted_status && opts.retweeted_by) {
      context.retweet = true;
      context.retweeted_by_user = status.user;
      context.status =  status.retweeted_status;
    }

    return context;
  };

  return Context;
});
