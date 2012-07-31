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
