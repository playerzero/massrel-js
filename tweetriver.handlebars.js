// depends on lib/twitter-text.js and lib/prettydate.js
(function() {

var tweetriver = window.tweetriver = window.tweetriver || {};
if(tweetriver.handlebars) {
  return;
}

function register(Handlebars) {

  Handlebars.registerHelper('autoLink', function(text) {
    return twttr.txt.autoLink(text, { target: '_blank' });
  });

  Handlebars.registerHelper('prettyDate', function(date) {
    date = tweetriver.helpers.fix_twitter_date(date);
    return prettyDate(date);
 });
}


function prepare_context(status) {
  if(status.retweeted_status) {
    var context = tweetriver.handlebars.prepare_context(status.retweeted_status);
    context.retweet = true;
    context.retweeted_by_user = status.user;
    return context;
  }

  var context = { status: status };
  return context;
};

// public api
tweetriver.handlebars = {
  register: register,
  prepare_context: prepare_context
};

})();
