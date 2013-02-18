define(['helpers', 'generic_poller_cycle'], function(helpers, GenericPollerCycle) {

  function GenericPoller(object, opts) {
    var self = this,
        fetch = function() {
          if(enabled) {
            var cg = helpers.callback_group();
            var inner_again = cg(again);

            // success callback
            var success = function(data) {
              // reset errors count
              self.consecutive_errors = 0;
              GenericPoller.failure_mode = self.failure_mode = false;

              if(enabled) { // being very thorough in making sure to stop polling when told

                // call any filters that have been added to augment data
                for(var i = 0, len = self._filters.length; i < len; i++) {
                  data = self._filters[i].call(self, data);
                }

                // call each listener with the data
                // wrapping the data in [], the strep_through method
                // will not enumerate through each item directly
                helpers.step_through([data],  self._listeners, self);
    
                if(enabled) { // poller can be stopped in any of the above iterators
                  inner_again();
                }
              }
            };

            // error callback
            var fail = function() {
              self.consecutive_errors += 1;
              GenericPoller.failure_mode = self.failure_mode = true;
              inner_again(true);
            };

            cycle = new GenericPollerCycle(inner_again, success, fail);

            // fetch data
            self.fetch(object, self.opts, cycle);
          }
        },
        again = function(error) {
          var delay = helpers.poll_interval(self.frequency * 1000);
          if(error) {
            delay = helpers.poll_backoff(delay, self.consecutive_errors);
          }
          tmo = setTimeout(fetch, delay);
        },
        cycle = null, // keep track of last cycle
        enabled = false,
        tmo;

    this._listeners = [];
    this._filters = [];
    this.opts = opts || {};
    this.frequency = (this.opts.frequency || 30);
    this.alive_count = 0;
    this.consecutive_errors = 0;
    this.failure_mode = false;

    this.start = function() {
      if(!enabled) { // guard against multiple pollers
        enabled = true;
        fetch();
      }
      return this;
    };
    this.stop = function() {
      if(cycle) {
        cycle.disable();
        cycle = null;
      }
      clearTimeout(tmo);
      enabled = false;
      return this;
    };
  }

  GenericPoller.prototype.fetch = function(object, opts, cycle) {
    object.load(opts, cycle.callback, cycle.errback);
    return this;
  };

  GenericPoller.prototype.data = function(fn) {
    this._listeners.push(fn);
    return this;
  };

  GenericPoller.prototype.filter = function(fn) {
    this._filters.push(fn);
    return this;
  };

  // global failure flag
  // once one poller is in failure mode
  // we want to make all others switch to
  GenericPoller.failure_mode = false;

  return GenericPoller;
});
