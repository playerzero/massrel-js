describe('GenericPoller', function() {

  var testPoll = function(cb, error, data) {
    error = !!error;
    var fulfilled = false;
    data = data || [
      { entity_id: '123', queued_at: 987 },
      { entity_id: '456', queued_at: 654 }
    ];

    waitsFor(function() {
      return fulfilled;
    }, 7e3);

    var object = {};
    object.load = function(params, cb, errback) {
      setTimeout(function() {
        if(!error) {
          cb(data);
        }
        else {
          errback();
        }
      }, 0);
    };

    cb(object, function() {
      fulfilled = true;
    });
  };


  it('count consecutive errors', function() {
    var old_min = massrel.min_poll_interval;
    massrel.min_poll_interval = 0;
    testPoll(function(object, done) {
      var poller = new massrel.GenericPoller(object, {
        frequency: 0.0001
      });

      var i = 0;
      object.load = function(params, cb, errback) {
        errback();
        i = i + 1;
        if(i == 2) {
          expect(poller.consecutive_errors).toEqual(2);
          object.load = function(params, cb) {
            cb([]);
            // should reset once a successful poll happens
            expect(poller.consecutive_errors).toEqual(0);
            poller.stop();
            massrel.min_poll_interval = old_min;
            done();
          };
        }
      };

      poller.start();

    }, true);
  });

  it('failure mode should start once there is an error', function() {
    testPoll(function(object, done) {
      var poller = new massrel.GenericPoller(object);
      poller.start();

      setTimeout(function() {
        expect(poller.failure_mode).toEqual(true);
        poller.stop();

        object.load = function(params, cb) {
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
    testPoll(function(object, done) {
      var i = 0;
      object.load = function(params, cb, errback) {
        i = i + 1;
        var timestamp = +(new Date());
        if(last_timestamp) {
          var delta = timestamp - last_timestamp;
          var expected_delay = massrel.helpers.poll_backoff(freq * 1000, poller.consecutive_errors);

          expect(Math.round(delta / expected_delay)).toBe(1);
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

      var poller = new massrel.GenericPoller(object, {
        frequency: freq
      });
      poller.start();

    }, true);
  });

  it('calling #start should not cause multiple polls', function() {
    testPoll(function(object, done) {
      var loads = jasmine.createSpy();
      object.load = function(params, cb) {
        loads();
        cb([]);
      };

      var poller = new massrel.GenericPoller(object);
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
    testPoll(function(object, done) {
      var poller = new massrel.GenericPoller(object);
      poller.filter(function(statuses) {
        expect(statuses.length).toEqual(2);
        expect(statuses[0].queued_at).toEqual(987);
        poller.stop();
        done();
      });
      poller.start();
    });
  });

});

