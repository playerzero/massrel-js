define(['./helpers'], function(helpers) {

  function PollerQueue(poller, opts) {
    this.poller = poller;

    opts = helpers.extend(opts || {}, {
    });

    var queue = [];
    var callback = null;
    var locked = false;
    var lock_incr = 0;

    this.total = 0;
    this.enqueued = 0;
    this.count = 0;

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
