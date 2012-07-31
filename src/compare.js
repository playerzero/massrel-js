define(['helpers', 'compare_poller'], function(helpers, ComparePoller) {
  function Compare() {
    var self = this,
        fn, error;
	  
	  self.opts = {
	    streams : arguments[0]
	  };
	  
	  return self;
  }
  
  Compare.prototype.compare_url = function() {
    return helpers.api_url('/compare.json');
  };
  
  Compare.prototype.buildParams = function(opts) {
    var params = [];
    
    opts = opts || {};

    if (opts.streams) {
      var streams = opts.streams;
      
      if(helpers.is_array(streams)) {
        streams = streams.slice(0);
      }
      
      params.push(['streams', streams]);
    }
    
    return params;
  };
  
  Compare.prototype.load = function (fn, error) {
    var self = this,
        params = self.buildParams(self.opts);
    
    helpers.jsonp_factory(this.compare_url(), params, 'meta_', this, fn, error);
    
	  return this;
  };
  
  Compare.prototype.poller = function (opts) {
    return new ComparePoller(this, opts);
  };
  
  return Compare;
});

define('compare_poller', ['helpers'], function(helpers) {
  function ComparePoller(object, opts) {
	  var self = this,
	      fetch = function () {
	        if (enabled) {
	          object.load(function (data) {
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