// depends on lib/twitter-text.js and lib/prettydate.js
(function() {

var massrel = window.massrel = window.massrel || {};
if(massrel.handlebars) {
  return;
}

function register(Handlebars) {

  Handlebars.registerHelper('autoLink', function(text) {
    var options = { target: '_blank' };

    if(this.source.twitter) {
      if(this.status.entities && this.status.entities.urls) {
        options.urlEntities = this.status.entities.urls;
      }
      return twttr.txt.autoLink(text, options);
    }

    return twttr.txt.autoLinkUrlsCustom(text, options);
  });

  Handlebars.registerHelper('prettyDate', function(date) {
    date = massrel.helpers.fix_twitter_date(date);
    return prettyDate(date);
 });

}

function prepare_context(status, opts) {
  if(status.retweeted_status) {
    var context = massrel.handlebars.prepare_context(status.retweeted_status, opts);
    context.retweet = true;
    context.retweeted_by_user = status.user;
    return context;
  }
  
  opts = massrel.helpers.extend(opts || {}, {
    intents: true
  });

  var context = {
    status: status,
    intents: opts.intents,
    source: {
      facebook: false,
      twitter: false
    },
    known: true
  };

  // determine status source
  if(status.facebook_id) {
    context.source.facebook = true;
    context.known = (typeof(status.message) === 'string');
  }
  else {
    context.source.twitter = true;
  }

  return context;
};

// public api
massrel.handlebars = {
  register: register,
  prepare_context: prepare_context
};

})();
