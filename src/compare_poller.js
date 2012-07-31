define(['helpers'], function(helpers) {
  function ComparePoller(object, opts) {
	  var self = this,
	      fetch = function () {
	        if (enabled) {
	          object.load(function(data) {
	            if (enabled) {
	              helpers.step_through(data, self._listeners, self);
	              
	              if (enabled) {
	                again();
	              }
	            }
	          });
	        }
	      },
	      again = function () {
	        tmo = setTimeout(fetch, helpers.poll_interval(self.opts.frequency));
	      },
	      enabled = false,
	      tmo;
	      
	  self._listeners = [];
	  
	  self.opts = opts || {};
	  self.opts.frequency = (self.opts.frequency || 30) * 1000;
	  
	  self.start = function () {
	    if (!enabled) {
	      enabled = true;
	      fetch();
	    }
	    
	    return this;
	  };
	  
	  self.stop = function () {
	    clearTimeout(tmo);
	    enabled = false;
	    
	    return this;
	  };
  }
  
  ComparePoller.prototype.data = function(fn) {
    this._listeners.push(fn);
    return this;
  };
  
  // alias each
  ComparePoller.prototype.each = ComparePoller.prototype.data;

  return ComparePoller;
});
