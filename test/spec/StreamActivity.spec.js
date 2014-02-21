describe('StreamActivity', function() {

  var testActivity = function(defaults) {
    var stream = new massrel.Stream('bdainton/woot');
    var activity = new massrel.StreamActivity(stream, defaults || {});
    return activity;
  };

  it('#url', function() {
    var activity = testActivity();
    expect(activity.url()).toEqual('http://api.massrelevance.com/bdainton/woot/activity.json');
  });

  it('#fetch', function(done) {
    var activity = testActivity();
    var old_request_factory = massrel.helpers.request_factory;

    spyOn(activity, 'url');
    spyOn(activity, 'params');

    var options = {
      resolution: '1m',
      start: -10
    };

    var period_size = 1;
    var periods = 5;

    massrel.helpers.request_factory = function(url, params, prefix, instance, fn, erroback) {
      // test to make sure request is ideal
      expect(activity.url).toHaveBeenCalled();
      expect(activity.params).toHaveBeenCalled();
      expect(url).toEqual(activity.url());
      expect(params).toEqual(activity.params(options));

      // create data representing mock response
      fn({
        start: 1,
        finish: 6,
        periods: periods,
        period_size: period_size,
        verbose: 0,
        activity: [{}, {}, {}, {}, {}]
      });
    };

    activity.fetch(options, function(data) {
      // test to make sure the data interoplation is correct
      for(var i = 0; i < 5; i++) {
        var start = 1 + period_size * i;
        expect(data.activity[i].start).toEqual(start);
        expect(data.activity[i].finish).toEqual(start + period_size);
      }
      done();
    });

    massrel.helpers.request_factory = old_request_factory;
  });

  it('#poller', function() {
    var activity = testActivity();

    activity.fetch = jasmine.createSpy('fetch');

    var options = {
     'resolution': '10m',
     'finish': 10
    };
    var poller = activity.poller(options);
    poller.start();
    expect(activity.fetch).toHaveBeenCalled();
    expect(activity.params(activity.fetch.calls.mostRecent().args[0])).toEqual(activity.params(options));
    expect(typeof(activity.fetch.calls.mostRecent().args[1])).toEqual('function');
    expect(typeof(activity.fetch.calls.mostRecent().args[2])).toEqual('function');
    poller.stop();
  });

  it('#params', function() {
    var activity = testActivity();
    var params;  

    var testParam = function(opts, key, val, length) {
      var params = activity.params(opts);
      expect(params.length).toEqual(length || 2);
      expect(params[0][0]).toEqual(key);
      expect(params[0][1]).toEqual(val);
    };

    testParam(undefined, 'verbose', 0, 1);
    testParam({}, 'verbose', 0, 1);
    testParam({ view: 'approved' }, 'view', 'approved');
    testParam({ topic: 'test' }, 'topic', 'test');
    // only `view` should be used if both `view` and `topic` provided
    testParam({ view: 'approved', topic: 'test' }, 'view', 'approved');
    testParam({ start: 60 }, 'start', 60);
    testParam({ start: 0 }, 'start', 0);
    testParam({ start: -1 }, 'start', -1);
    testParam({ finish: 60 }, 'finish', 60);
    testParam({ finish: 0 }, 'finish', 0);
    testParam({ finish: -1 }, 'finish', -1);
    testParam({ periods: 1 }, 'periods', 1);
    testParam({ periods: 0 }, 'periods', 0);
    testParam({ resolution: '1m' }, 'resolution', '1m');
    testParam({ tz_offset: 1 }, 'tz_offset', 1);
    testParam({ tz_offset: 0 }, 'tz_offset', 0);
    testParam({ tz_offset: -1 }, 'tz_offset', -1);
    testParam({ encode: 'unix' }, 'encode', 'unix');
    testParam({ encode: 'iso8601' }, 'encode', 'iso8601');
  });

  it('#predef', function() {
    var activity = testActivity();

    activity.approved();
    expect(activity.defaults.view).toEqual('approved');

    activity.pending();
    expect(activity.defaults.view).toEqual('pending');

    activity.rejected();
    expect(activity.defaults.view).toEqual('rejected');

    activity.minutes();
    expect(activity.defaults.resolution).toEqual('1m');

    activity.ten_minutes();
    expect(activity.defaults.resolution).toEqual('10m');

    activity.hours();
    expect(activity.defaults.resolution).toEqual('1h');

    activity.days();
    expect(activity.defaults.resolution).toEqual('1d');
  });

});
