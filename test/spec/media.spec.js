describe('media scaper', function() {

  var ASYNC_TIMEOUT = 1000;

  var media_url = massrel.media.media_url;
  var urlRun = function(name, url) {
    it(name, function() {

      runs(function() {
        var success = jasmine.createSpy('success');
        var error = jasmine.createSpy('error');

        media_url(url, success, error);

        setTimeout(function() {
          expect(success).toHaveBeenCalled();
          expect(error).not.toHaveBeenCalled();
        }, ASYNC_TIMEOUT);
      });

      waits(ASYNC_TIMEOUT);
    });
  };

  urlRun('match flickr url', 'http://flic.kr/p/5waghv');
  urlRun('match yfrog url', 'http://yfrog.com/h02gvclj');
  urlRun('match twitpic url', 'http://twitpic.com/3x9wso');
  urlRun('match instagram url', 'http://instagr.am/p/BdLaS/');
  urlRun('match plixi url', 'http://plixi.com/p/75523311');

});
