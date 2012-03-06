define(['helpers'], function(helpers) {

  function MetaPoller(object, opts) {
    var self = this
      , fetch = function() {
					console.log(self.opts);
          object.meta(self.opts, function(data) { // success
            helpers.step_through(data, self._listeners, self);
            again();
          }, function() { // error
            again();
          });
        }
      , again = function() {
          tmo = setTimeout(fetch, helpers.poll_interval(self.opts.frequency));
        }
      , enabled = false
      , tmo;

    this._listeners = [];

    this.opts = opts || {};
		
    this.opts.frequency = (opts.frequency || 30) * 1000;
    delete opts.frequency;

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

  MetaPoller.prototype.data = function(fn) {
    this._listeners.push(fn);
    return this;
  };
  // alias #each
  MetaPoller.prototype.each = MetaPoller.prototype.data;

  return MetaPoller;
});

