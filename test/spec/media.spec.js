describe('media scaper', function() {

  var ASYNC_TIMEOUT = 1000;

  var media_url = massrel.media.media_url;
  var urlRun = function(name, url, media_url_to_match, context) {
    it(name, function() {

      runs(function() {
        var success = jasmine.createSpy('success');
        var error = jasmine.createSpy('error');

        media_url(url, context, function(derived_media_url) {
          expect(derived_media_url).toEqual(media_url_to_match);
          success();
        }, error);

        setTimeout(function() {
          expect(success).toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
        }, ASYNC_TIMEOUT);
      });

      waits(ASYNC_TIMEOUT);
    });
  };

  urlRun('match flickr url', 'http://flic.kr/p/5waghv', 'http://farm4.static.flickr.com/3059/2966729377_38483a86b6.jpg');
  urlRun('match yfrog url', 'http://yfrog.com/h02gvclj', 'http://yfrog.com/h02gvclj:iphone');
  urlRun('match twitpic url', 'http://twitpic.com/3x9wso', 'http://twitpic.com/show/large/3x9wso');
  urlRun('match instagram url', 'http://instagr.am/p/BdLaS/', 'http://distillery.s3.amazonaws.com/media/2011/02/07/5d03d258fbd849d688a1c3e5a08e0c47_7.jpg');
  urlRun('match plixi url', 'http://plixi.com/p/75523311', 'http://c0013639.r32.cf1.rackcdn.com/x2_48064ef');
  urlRun('match lockerz url', 'http://lockerz.com/s/148475342', 'http://api.plixi.com/api/tpapi.svc/imagefromurl?size=medium&url=http://lockerz.com/s/148475342');


  var statusWithPic = {in_reply_to_status_id:null,possibly_sensitive:!1,in_reply_to_user_id_str:null,contributors:null,truncated:!1,id_str:"125642866478432256",user:{listed_count:0,profile_use_background_image:!0,time_zone:"Central Time (US & Canada)","protected":!1,notifications:null,profile_text_color:"333333",name:"Michael Shiels",statuses_count:194,following:null,verified:!1,geo_enabled:!0,profile_background_image_url:"http://a2.twimg.com/profile_background_images/306027644/IMG_0443.JPG",favourites_count:1,id_str:"323399044",utc_offset:-21600,profile_link_color:"009999",profile_image_url:"http://a2.twimg.com/profile_images/1589282540/image_normal.jpg",description:"",default_profile_image:!1,location:"San Antonio, Texas",default_profile:!1,profile_background_color:"131516",is_translator:!1,profile_background_tile:!1,profile_background_image_url_https:"https://si0.twimg.com/profile_background_images/306027644/IMG_0443.JPG",url:null,follow_request_sent:null,friends_count:25,profile_sidebar_fill_color:"efefef",followers_count:22,lang:"en",show_all_inline_media:!0,contributors_enabled:!1,profile_sidebar_border_color:"eeeeee",profile_image_url_https:"https://si0.twimg.com/profile_images/1589282540/image_normal.jpg",id:323399044,created_at:"Fri Jun 24 19:21:09 +0000 2011",screen_name:"MichaelShielsSA"},retweet_count:0,in_reply_to_user_id:null,favorited:!1,geo:{type:"Point",coordinates:[29.57621695,-98.45831789]},in_reply_to_screen_name:null,entities:{urls:[],hashtags:[],media:[{type:"photo",expanded_url:"http://twitter.com/MichaelShielsSA/status/125642866478432256/photo/1",id_str:"125642866482626560",indices:[53,73],url:"http://t.co/UKK5gwx9",media_url:"http://p.twimg.com/Ab5fhXlCQAAwYvo.jpg",display_url:"pic.twitter.com/UKK5gwx9",id:0x1be5f8579424000,media_url_https:"https://p.twimg.com/Ab5fhXlCQAAwYvo.jpg",sizes:{small:{h:453,w:340,resize:"fit"},large:{h:640,w:480,resize:"fit"},thumb:{h:150,w:150,resize:"crop"},medium:{h:640,w:480,resize:"fit"}}}],user_mentions:[]},coordinates:{type:"Point",coordinates:[-98.45831789,29.57621695]},source:'<a href="http://twitter.com/#!/download/iphone" rel="nofollow">Twitter for iPhone</a>',place:{name:"San Antonio",place_type:"city",attributes:{},full_name:"San Antonio, TX",country:"United States",bounding_box:{type:"Polygon",coordinates:[[[-98.763873,29.230903],[-98.222958,29.230903],[-98.222958,29.731075],[-98.763873,29.731075]]]},url:"http://api.twitter.com/1/geo/id/3df4f427b5a60fea.json",country_code:"US",id:"3df4f427b5a60fea"},retweeted:!1,id:0x1be5f8579024000,in_reply_to_status_id_str:null,text:"Even though the Longhorns lost, we had a great time! http://t.co/UKK5gwx9",created_at:"Sun Oct 16 18:42:48 +0000 2011"};
  var mediaEntities = [{type:"photo",expanded_url:"http://twitter.com/MichaelShielsSA/status/125642866478432256/photo/1",id_str:"125642866482626560",indices:[53,73],url:"http://t.co/UKK5gwx9",media_url:"http://p.twimg.com/Ab5fhXlCQAAwYvo.jpg",display_url:"pic.twitter.com/UKK5gwx9",id:0x1be5f8579424000,media_url_https:"https://p.twimg.com/Ab5fhXlCQAAwYvo.jpg",sizes:{small:{h:453,w:340,resize:"fit"},large:{h:640,w:480,resize:"fit"},thumb:{h:150,w:150,resize:"crop"},medium:{h:640,w:480,resize:"fit"}}}];

  urlRun('match pic.twitter.com url (with status)', 'http://pic.twitter.com/UKK5gwx9', 'http://p.twimg.com/Ab5fhXlCQAAwYvo.jpg', statusWithPic);
  urlRun('match pic.twitter.com url (with media array)', 'http://pic.twitter.com/UKK5gwx9', 'http://p.twimg.com/Ab5fhXlCQAAwYvo.jpg', mediaEntities);

});
