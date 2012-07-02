define(['helpers'], function(helpers) {
  function Compare() {
	this.opts = arguments[0];
    
    if(this.opts.frequency) {
      this.frequency = Math.max(this.opts.frequency, 5) * 1000;
    }
	  
	var fn = arguments[1] || null;
	var error = arguments[2] || null;
	  
    if(this.opts.frequency) {
      this.poll(fn, error);
    } else {
	  this.load(fn, error);
    }
  }
  Compare.prototype.compare_url = function() {
    return helpers.api_url('/compare.json');
  };
  Compare.prototype.buildParams = function(opts) {
    opts = opts || {};
    var params = [];
    if(opts.streams) {
      params.push(['streams', opts.streams]);
    }
    return params;
  };
  Compare.prototype.load = function (fn, error) {
    var params = this.buildParams(this.opts);
    helpers.jsonp_factory(this.compare_url(), params, 'meta_', this, fn, error);
    
	return this;
  };
  Compare.prototype.poll = function (fn, error) {
    var self = this;
    if(self._t) {
      return this;
    }
    
    self.enabled = true;

    function poll() {
      self.alive = false;

      if(!self.enabled) { return; }

      self.load(function (data) {
        self.alive = true;

        if (typeof fn === 'function') {
          fn(data);
        }   
        self._t = setTimeout(poll, self.frequency);
      }, error);
    }
    poll();
	  return this;
  };

  return Compare;
});