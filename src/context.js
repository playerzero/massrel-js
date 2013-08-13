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

    if (status.network === 'google_plus') {
      context.source.google = context.known = true;
      context.sourceName = 'google';
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

  /*
   * attempt to extract a photo url
   * in the case of twitter, we may return a url which is not a photo, so double-check after you hit embedly
   */
  Context.prototype.getPhotoUrl = function() {
    if (this.photo_url !== undefined) {
      //return cached result
      return this.photo_url;
    }

    var ret = false;
    
    if (this.status && this.known) {
      if (this.source.twitter) {
        if (this.status.entities.media && this.status.entities.media.length) {
          var media = this.status.entities.media[0];
          ret = {
            url: media.media_url,
            width: media.sizes.medium.w,
            height: media.sizes.medium.h,
            link_url: media.url || media.expanded_url
          };
        }
        else if (this.status.entities.urls && this.status.entities.urls.length) {
          ret = {url: this.status.entities.urls[0].expanded_url || this.status.entities.urls[0].url};
        }
      }
      else if (this.source.facebook && ((this.status.type && this.status.type === 'photo') || (this.status.kind && this.status.kind === 'photo'))) {
        ret = {url: this.status.picture.replace(/_[st]./, '_n.')};
      }
      else if (this.source.google && this.status.object.attachments.length && this.status.object.attachments[0].objectType === 'photo') {
        ret = {url: this.status.object.attachments[0].fullImage.url};
      }
      else if (this.source.instagram && this.status.type === 'image') {
        ret = {url: this.status.images.standard_resolution.url};
      }
    }

    //cache result for later use
    this.photo_url = ret;
    return ret;
  };

  return Context;
});
