// requires: jquery
(function() {

var callbacks = [];

massrel.analytics = function(fn) {
  if(typeof(fn) === 'function') {
    callbacks.push(fn);
    if(callbacks.length === 1) {
      init();
    }
  }
};

function track(name, status_id, region, elem) {
  for(var i = 0, len = callbacks.length; i < len; i++) {
    callbacks[i](name, status_id, region, elem);
  }
}

function init() {
  $('body').delegate('[data-massrel-id] a', 'click', function() {
    var link = $(this),
        href = link.attr('href'),
        target = link.closest('[data-massrel-id]'),
        status_id = target.attr('data-massrel-id'),
        network = target.closest('[data-massrel-network]').attr('data-massrel-network'),
        region = target.closest('[data-massrel-region]').attr('data-massrel-region');

    if(network) {
      status_id = network+'_'+status_id;
    }

    if(href) {
      if(href.indexOf('twitter.com') > -1) {

        if(href.indexOf('/status/') > -1) { // status
          name = 'status'
        }
        else if(href.indexOf('/search?q=') > -1) { // hashtag
          name = 'hashtag'
        }
        else if(href.indexOf('tweet?in_reply_to=') > -1) { // reply
          name = 'reply'
        }
        else if(href.indexOf('intent/retweet') > -1) { // retweet
          name = 'rt'
        }
        else if(href.indexOf('intent/favorite') > -1) { // favorite
          name = 'fav'
        }
        else if(href.indexOf('intent/user') > -1) { // follow
          name = 'follow'
        }
        else { // user (assumption)
          name = 'user'
        }
      }
      else {
        // status link
        name = 'url'
      }

      if(name) {
        track(name, status_id, region, link[0]);
      }

    }
  });

}


})();
