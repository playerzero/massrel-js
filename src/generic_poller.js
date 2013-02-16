define(['helpers'], function(helpers) {

  function GenericPoller(object, opts) {
    var self = this,
        fetch = function() {
          if(enabled) {
            self.fetch(object, self.opts, again, function(data) { // success
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
                  again();
                }
              }
            }, function() { // error
              self.consecutive_errors += 1;
              GenericPoller.failure_mode = self.failure_mode = true;
              again(true);
            });
          }
        },
        again = function(error) {
          var delay = helpers.poll_interval(self.frequency * 1000);
          if(error) {
            delay = helpers.poll_backoff(delay, self.consecutive_errors);
          }
          tmo = setTimeout(fetch, delay);
        },
        enabled = false,
        tmo;

    this._listeners = [];
    this._filters = [];
    this.opts = opts || {};
    this.frequency = (this.opts.frequency || 30);
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
      clearTimeout(tmo);
      enabled = false;
      return this;
    };
  }

  GenericPoller.prototype.fetch = function(object, opts, callback, error) {
    object.load(opts, callback, error);
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
