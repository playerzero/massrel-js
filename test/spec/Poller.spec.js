describe('Poller', function() {

  var testPoll = function(cb, error, data) {
    error = !!error;
    var fulfilled = false;
    var stream = {};
    data = data || [
      { entity_id: '123', queued_at: 987 },
      { entity_id: '456', queued_at: 654 }
    ];

    waitsFor(function() {
      return fulfilled;
    }, 7e3);

    stream.load = function(params, cb, errback) {
      setTimeout(function() {
        if(!error) {
          cb(data);
        }
        else {
          errback();
        }
      }, 0);
    };

    cb(stream, function() {
      fulfilled = true;
    });
  };

  it('use Stream#load for new data', function() {
    var stream = {};
    stream.load = jasmine.createSpy();

    var poller = new massrel.Poller(stream);
    poller.start();
    expect(stream.load).toHaveBeenCalled();
    poller.stop();
  });

  it('correctly curse through API', function() {
    testPoll(function(stream, done) {
      var poller = new massrel.Poller(stream);
      poller.batch(function() {
        expect(poller.since_id).toEqual('123');
        expect(poller.start_id).toEqual('456');
        expect(poller.newest_timestamp).toEqual(987);
        poller.stop();
        done();
      });
      poller.start();
    });
  });

  it('#batch callback called with full array', function() {
    testPoll(function(stream, done) {
      var poller = new massrel.Poller(stream);
      poller.batch(function(statuses) {
        expect(statuses.length).toEqual(2);
        expect(statuses[0].entity_id).toEqual('123');
        expect(statuses[1].entity_id).toEqual('456');
        poller.stop();
        done();
      });
      poller.start();
    });
  });

  it('#each callback called with individual items from oldest to newest', function() {
    testPoll(function(stream, done) {
      var i = 0;
      var statuses = [
        { entity_id: '456' },
        { entity_id: '123' }
      ];
      var poller = new massrel.Poller(stream);
      poller.each(function(status) {
        var expected = statuses.shift();
        expect(expected.entity_id).toEqual(status.entity_id);
        i = i + 1;
        if(i == 2) {
          poller.stop();
          done();
        }
      });
      poller.start();
    });
  });

  it('filter newer should remove older items', function() {
    var newer;
    var items = [
      { queued_at: 987 },
      { queued_at: 123 }
    ];

    newer = massrel.Poller.filter_newer(items, 123);
    expect(newer.length).toEqual(1);
    expect(newer[0].queued_at).toEqual(987);

    newer = massrel.Poller.filter_newer(items, 1000);
    expect(newer.length).toEqual(0);

    newer = massrel.Poller.filter_newer(items, 0);
    expect(newer.length).toEqual(2);
    expect(newer[0].queued_at).toEqual(987);
    expect(newer[1].queued_at).toEqual(123);
  });

  it('hail mary mode should not poll with since_id', function() {
    testPoll(function(stream, done) {
      stream.load = function(params) {
        expect(params.since_id).toEqual(undefined);
        poller.stop();
        done();
      };

      var poller = new massrel.Poller(stream, {
        since_id: '1',
        hail_mary_mode: true
      });

      poller.start();
    });
  });

  it('failure mode should not poll with since_id', function() {
    var min = massrel.min_poll_interval;
    massrel.min_poll_interval = 0;

    testPoll(function(stream, done) {
      var i = 0;
      stream.load = function(params, cb, errback) {
        if(i == 0) {
          expect(params.since_id).toEqual('1');
          setTimeout(function() { errback(); }, 0);
        }
        else {
          expect(poller.failure_mode).toEqual(true);
          expect(params.since_id).toEqual(undefined);
          poller.stop();
          massrel.min_poll_interval = min;
          done();
        }

        i = i + 1;
      };

      var poller = new massrel.Poller(stream, {
        since_id: '1',
        frequency: 0.1
      });

      poller.start();
    });
  });


  it('use correct params when making request', function() {
    var testParam = function(opts, key, val) {
      var stream = new massrel.Stream('a/b');
      var poller = new massrel.Poller(stream, opts);
      var params = stream.buildParams(poller.opts);
      if(params.length > 0) {
        expect(key).toEqual(params[0][0]);
        expect(val).toEqual(params[0][1]);
      }
      else {
        expect(key).toEqual(undefined);
        expect(val).toEqual(undefined);
      }

    };

    testParam({ limit: 2 }, 'limit', 2);
    testParam({ replies: true }, 'replies', '1');
    testParam({ geo_hint: true }, 'geo_hint', '1');
    testParam({ keywords: 'abc' }, 'keywords', 'abc');
    testParam({ network: 'massrelevance' }, 'network', 'massrelevance');
    testParam({ timeline_search: true }, 'timeline_search', '1');
    testParam({ random: 'blah' }, undefined, undefined);
  });

});
