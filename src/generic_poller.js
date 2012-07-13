define(['helpers'], function(helpers) {

  function GenericPoller(object, opts) {
    var self = this,
        fetch = function() {
          if(enabled) {
            self.fetch(object, self.opts, again, function(data) { // success
              if(enabled) { // being very thorough in making sure to stop polling when told

                // call each listener with the data
                // wrapping the data in [], the strep_through method
                // will not enumerate through each item directly
                helpers.step_through([data],  self._listeners, self);
    
                if(enabled) { // poller can be stopped in any of the above iterators
                  again();
                }
              }
            }, function() { // error
              again();
            });
          }
        },
        again = function() {
          tmo = setTimeout(fetch, helpers.poll_interval(self.frequency * 1000));
        },
        enabled = false,
        tmo;

    this._listeners = [];
    this.opts = opts || {};
    this.frequency = (this.opts.frequency || 30);

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

  return GenericPoller;
});
