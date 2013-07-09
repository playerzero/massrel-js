define(['helpers'], function(helpers) {

  function Context(status) {
    this.status = status;
    this.source = {
      facebook: false,
      twitter: false,
      google: false,
      instagram: false,
      rss: false,
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

    context.intents = opts.intents;

    // determine status source
    if(status.id_str && status.text && status.entities) {
      // source: twitter
      context.source.twitter = context.known = true;
    }
    if(status.network === 'facebook') {
      context.source.facebook = context.known = true;
    }
    else if(status.network === 'google_plus') {
      context.source.google = context.known = true;
    }
    else if(status.network === 'instagram') {
      context.source.instagram = context.known = true;
    }
    else if(status.network === 'rss') {
      // source: internal message
      context.source.rss = context.known = true;
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
