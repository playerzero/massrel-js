define(['helpers'], function(helpers) {

  function MetaPoller(stream, opts) {
    var self = this
      , fetch = function() {
          stream.meta({
            disregard: self.disregard
          }, function(data) { // success
            helpers.step_through(data, self._listeners, self);
            again();
          }, function() { // error
            again();
          });
        }
      , again = function() {
          tmo = setTimeout(fetch, self.frequency);
        }
      , enabled = false
      , tmo;

    this._listeners = [];

    opts = opts || {};
    this.disregard = opts.diregard || null;
    this.frequency = (opts.frequency || 30) * 1000;

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

