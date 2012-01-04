define(['helpers'], function(helpers) {

  function PollerQueue(poller, opts) {
    this.poller = poller;

    opts = helpers.extend(opts || {}, {
      history_size: 0,
      history_timeout: poller.frequency / 1000
    });

    var queue = [];
    var history = [];
    var callback = null;
    var locked = false;
    var lock_incr = 0;
    var last_history_total = 0;

    this.total = 0;
    this.enqueued = 0;
    this.count = 0;
    this.reused = 0;

    var self = this;
    poller.batch(function(statuses) {
      var len = statuses.length;
      var i = len - 1;
      for(; i >= 0; i--) { // looping through from bottom to top to queue statuses from oldest to newest
        queue.push(statuses[i]);
      }
      self.total += len;
      self.enqueued += len;

      step();
    });

    function check_history() {
      last_history_total = self.total;
      setTimeout(function() {
        if(self.poller.enabled && self.total === last_history_total && history.length > 0 && queue.length === 0) {
          var index = Math.min(Math.floor(history.length * Math.random()), history.length - 1);
          var status = history[index];
          queue.push(status);

          self.total += 1;
          self.enqueued += 1;
          self.reused += 1;

          step();
        };
        check_history();
      }, opts.history_timeout * 1000);
    }
    if(opts.history_size > 0) {
      check_history();
    }

    function step() {
      if(!locked && queue.length > 0 && typeof callback === 'function') {
        var lock_local = ++lock_incr;

        self.enqueued -= 1;
        self.count += 1;
        var status = queue.shift();
        locked = true;

        callback.call(self, status, function() {
          if(lock_local === lock_incr) {
            locked = false;
            setTimeout(step, 0);
          }
        });

        if(opts.history_size > 0 && !status.__recycled) {
          if(opts.history_size === history.length) {
            history.shift();
          }
          status.__recycled = true;
          history.push(status);
        }

      }
    }

    this.next = function(fn) {
      if(!locked && typeof fn === 'function') {
        callback = fn;
        step();
      }
    };
  };

  return PollerQueue;
});
