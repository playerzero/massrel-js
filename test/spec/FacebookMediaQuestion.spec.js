describe('FacebookMediaQuestion', function() {

  it('use correct RESTful urls', function() {
    var facebookMediaQuestion = new massrel.FacebookMediaQuestion();
    expect(facebookMediaQuestion.url()).toEqual('http://api.massrelevance.com/facebook/media_question.json');
  });

  it('use correct params from options', function() {
    var facebookMediaQuestion = new massrel.FacebookMediaQuestion();
    var params;

    params = facebookMediaQuestion.buildParams();
    expect(params.length).toEqual(0);

    params = facebookMediaQuestion.buildParams({});
    expect(params.length).toEqual(0);

    var testParam = function(opts, key, val) {
      var params = facebookMediaQuestion.buildParams(opts);
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam({ id: 5 }, 'id', 5);
    testParam({ page: '100001' }, 'page', '100001');
  });

  it('will not break when #load is called (end-to-end test)', function() {
    var facebookMediaQuestion = new massrel.FacebookMediaQuestion();
    var old_request_factory = massrel.helpers.request_factory;

    var opts = {
      id: '123456',
      page: 'test'
    };

    massrel.helpers.request_factory = function(url, params, jsonp_prefix, obj, callback, error) {
      expect(facebookMediaQuestion.url()).toEqual(url);
      expect(facebookMediaQuestion.buildParams(opts)).toEqual(params);
    };

    facebookMediaQuestion.load(opts, function(data) { });

    massrel.helpers.request_factory = old_request_factory;
  });
});