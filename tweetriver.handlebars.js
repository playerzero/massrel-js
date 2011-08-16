// depends on lib/twitter-text.js and lib/prettydate.js
(function() {

var massrel = window.massrel = window.massrel || {};
if(massrel.handlebars) {
  return;
}

function register(Handlebars) {

  Handlebars.registerHelper('autoLink', function(text) {
    return twttr.txt.autoLink(text, { target: '_blank', urlEntities: this.status.entities.urls });
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
    intents: opts.intents
  };
  return context;
};

// public api
massrel.handlebars = {
  register: register,
  prepare_context: prepare_context
};

})();
