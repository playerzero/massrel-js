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
      if(this.status.entities) {
        if(this.status.entities.urls) {
          options.urlEntities = this.status.entities.urls;
        }
        if(this.status.entities.media) {
          options.urlEntities = (options.urlEntities || []).concat(this.status.entities.media);
        }
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

function prepare_context(status, opts) { // alias for backwards compatability
  return massrel.Context.create(status, opts);
};

// public api
massrel.handlebars = {
  register: register,
  prepare_context: prepare_context
};

})();
