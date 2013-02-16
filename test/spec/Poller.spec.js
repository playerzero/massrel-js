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
          done();
        }
      });
      poller.start();
      poller.stop();
    });
  });

  it('count consecutive errors', function() {
    testPoll(function(stream, done) {
      var poller = new massrel.Poller(stream);
      poller.start();
      poller.stop();
      poller.start();
      poller.stop();

      setTimeout(function() {
        expect(poller.consecutive_errors).toEqual(2);

        stream.load = function(params, cb) {
          cb([]);
          // should reset once a successful poll happens
          expect(poller.consecutive_errors).toEqual(0);
          poller.stop();
          done();
        };

        poller.start();

        done();
      }, 100);
    }, true);
  });

  it('failure mode should start once there is an error', function() {
    testPoll(function(stream, done) {
      var poller = new massrel.Poller(stream);
      poller.start();

      setTimeout(function() {
        expect(poller.failure_mode).toEqual(true);
        poller.stop();

        stream.load = function(params, cb) {
          cb([]);
          // should reset once a successful poll happens
          expect(poller.failure_mode).toEqual(false);
          poller.stop();
          done();
        };

        poller.start();

      }, 100);
    }, true);
  });

  it('errors should backoff intervals', function() {
    var freq = 0.1;
    var min = massrel.min_poll_interval;
    var rate = massrel.backoff_rate;
    massrel.min_poll_interval = 0;
    massrel.backoff_rate = 2;

    var last_timestamp;
    var last_delta;
    testPoll(function(stream, done) {
      var i = 0;
      stream.load = function(params, cb, errback) {
        i = i + 1;
        var timestamp = +(new Date());
        if(last_timestamp) {
          var delta = timestamp - last_timestamp;
          var expected_delay = massrel.helpers.poll_backoff(freq * 1000, poller.consecutive_errors);

          expect(Math.abs(delta - expected_delay)).toBeLessThan(20)
          expect(Math.round(delta / expected_delay)).toBe(1)
          if(last_delta) {
            expect(Math.round(delta / last_delta)).toBe(massrel.backoff_rate);
          }
          last_delta = delta;
        }
        last_timestamp = timestamp;
        setTimeout(errback, 0);

        if(i == 5) {
          poller.stop();
          massrel.min_poll_interval = min;
          massrel.backoff_rate = rate;
          done();
        }
      };

      var poller = new massrel.Poller(stream, {
        frequency: freq
      });
      poller.start();

    }, true);
  });

  it('calling #start should not cause multiple polls', function() {
    testPoll(function(stream, done) {
      var loads = jasmine.createSpy();
      stream.load = function(params, cb) {
        loads();
        cb([]);
      };

      var poller = new massrel.Poller(stream);
      for(var i = 0; i < 10; i++) {
        poller.start();
      }

      setTimeout(function() {
        expect(loads.callCount).toBe(1);
        poller.stop();
        done();
      }, 2e3);
      
    });
  });

  it('#filter should called with data', function() {
    testPoll(function(stream, done) {
      var poller = new massrel.Poller(stream, {
        newest_timestamp: 654
      });
      poller.batch(function(statuses) {
        expect(statuses.length).toEqual(1);
        expect(statuses[0].queued_at).toEqual(987);
        poller.stop();
        done();
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
      var poller = new massrel.Poller({}, opts);
      var params = poller.params({});
      expect(params[key]).toEqual(val);
    };

    testParam({ limit: 2 }, 'limit', 2);
    testParam({ replies: true }, 'replies', true);
    testParam({ geo_hint: true }, 'geo_hint', true);
    testParam({ keywords: 'abc' }, 'keywords', 'abc');
    testParam({ network: 'massrelevance' }, 'network', 'massrelevance');
    testParam({ timeline_search: true }, 'timeline_search', true);
    testParam({ random: 'blah' }, 'random', undefined);
  });

});
