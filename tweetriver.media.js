/*
 * The following code was derived from a public source file from twitter.com
 * licensed under the Apache 2 license...see legal stuff below
 */
 
/*
 * twitter-text-js 1.3.1
 *
 * Copyright 2010 Twitter, Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
 
(function() {
  var massrel = window.massrel = window.massrel || {};
  var m = massrel.media = massrel.media || {};
  
  var MEDIA = m.MEDIA = {};
  
  MEDIA.yfrog = {
    type: 'photo',
    matchers: {
      photo: /^(?:(?:https?\:\/\/)?(?:www\.)?)?yfrog\.com\/(\S+)/i
    },
    process: function(slug, matcher_name) {
      this('http://yfrog.com/'+slug+':iphone');
    }
  };
  
  MEDIA.twitpic = {
    matchers: {
      photo: /^(?:(?:https?\:\/\/)?(?:www\.)?)?twitpic\.com\/(\S+)/
    },
    process: function(slug) {
      this('http://twitpic.com/show/large/'+slug);
    }
  };
  
  MEDIA.instagram = {
    type: 'photo',
    matchers: {
      photo: /(^(?:(?:https?\:\/\/)?(?:[\w\-]+\.)?)?instagr\.am\/p\/[a-zA-Z0-9_\-]+\/?)/i
    },
    process: function(slug, matcher_name) {
      var self = this;
      $.ajax({
        url: 'http://instagr.am/api/v1/oembed',
        type: 'GET',
        dataType: 'jsonp',
        data: {
          url: slug
          //, maxwidth: A.maxwidth
        },
        success: function(resp) {
          if (!resp.error) {
            self(resp.url);
          }
          else {
            self.skip();
          }
        }
      });
    }
  };
  
  MEDIA.lockerz = {
    type: 'photo',
    matchers: {
      photo: /^(?:(?:https?\:\/\/)?(?:[\w\-]+\.)?)?lockerz\.com\/s\/(\d+)\/?/i
    },
    process: function(slug, matcher_name) {
      this('http://api.plixi.com/api/tpapi.svc/imagefromurl?size=medium&url=http://lockerz.com/s/'+encodeURIComponent(slug));
    }
  };

  MEDIA.plixi = {
    type: 'photo',
    matchers: {
      tweetphoto: /^(?:(?:https?\:\/\/)?(?:www\.)?)?tweetphoto\.com\/(\d+)/i,
      plixi: /^(?:(?:https?\:\/\/)?(?:www\.)?)?plixi\.com\/p\/(\d+)/i,
      mobile: /^(?:https?\:\/\/)?m\.plixi\.com\/p\/(\d+)/i
    },
    process: function(slug, matcher_name) {
      var self = this;
      $.ajax({
        url: 'http://tweetphotoapi.com/api/tpapi.svc/jsonp/photos/' + slug,
        dataType: 'jsonp',
        success: function(resp) {
          self(resp.MediumImageUrl);
        }
      });
    }
  };

  MEDIA.flickr = {
    type: 'photo',
    matchers: {
      photo: /^(?:(?:https?\:\/\/)?(?:www\.)?)?flickr\.com\/photos\/[\w\@\-]+\/(\d+)\/?/i,
      short1: /^(?:(?:https?\:\/\/)?(?:www\.)?)?flic\.kr\/p\/([a-z0-9]+)\/?$/i
    },
    process: function(slug, matcher_name) {
      var self = this;
      if(matcher_name === 'short1') {
        slug = base58(slug); 
      }
      
      flickr_request({
        data: {
          method: 'flickr.photos.getInfo',
          photo_id: slug
        },
        success: function(resp) {
          if (!resp.photo.media || resp.photo.media !== 'video') {
            var photo = resp.photo;
            self('http://farm'+photo.farm+'.static.flickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'.jpg');
          }
          else {
            self.skip();
          }
        }
      });
    }
  };
  
  var FLICKR_KEY = 'c4cfaaebe0780569e8377e509393e489';
  var FLICKR_DOMAIN = 'https:' === document.location.protocol ? 'https://secure.flickr.com' : 'http://flickr.com';
  var FLICKR_PHOTO_URL = 'http://flickr.com/photos';
  function flickr_request(options) {
    var defaults = {
      url: FLICKR_DOMAIN + '/services/rest',
      dataType: 'jsonp',
      jsonp: 'jsoncallback',
      data: {
        format: 'json',
        api_key: FLICKR_KEY
      },
      success: function (resp) {}
    };
      
    $.ajax($.extend(true, {}, defaults, options));
  }
  function base58(D) {
    var F = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    var B = D.length;
    var A = 0;
    var E = 1;
    for (var C = B - 1; C >= 0; C--) {
      A = A + E * F.indexOf(D[C]);
      E = E * F.length;
    }
    return A;
  }
  
  m.match_media = function(url) {
    var slug;
    for(var name in MEDIA) {
      var type = MEDIA[name];
      var matchers = type.matchers;
      for(var matcher_name in matchers) {
        if(slug = url.match(matchers[matcher_name])) {
          return {
            name: name,
            type: type,
            matcher_name: matcher_name,
            slug: slug[1]
          };
        }  
      }
    }
  };

  m.media_url = function(url, success, error) {
    var media = m.match_media(url);

    if(media) {
      function resume(media_url) {
        success(media_url, media);
      }

      resume.skip = function() {
        if(error) {
          error();
        }
      }

      media.type.process.call(resume, media.slug, media.matcher_name);
    }
    else if(error) {
     error();
    }
  };

})();
