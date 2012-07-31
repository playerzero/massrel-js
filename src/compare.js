define(['helpers', 'compare_poller'], function(helpers, ComparePoller) {
  function Compare(streams) {
    if(helpers.is_array(streams)) {
      // keep a copy of the array
      this.streams = streams.slice(0);
    }
    else if(typeof(streams) === 'string') {
      this.streams = [streams];
    }
    else {
      this.streams = [];
    }
  }
  
  Compare.prototype.compare_url = function() {
    return helpers.api_url('/compare.json');
  };
  
  Compare.prototype.buildParams = function(opts) {
    var params = [];
    
    opts = opts || {};

    if(opts.streams) {
      params.push(['streams', opts.streams]);
    }
    if(opts.target || opts.target >=0) {
      params.push('target', opts.target.toString());
    }
    
    return params;
  };
  
  Compare.prototype.load = function(opts, fn, error) {
    if(typeof(opts) === 'function') {
      error = fn;
      fn = opts;
      opts = null;
    }
    var params = this.buildParams(helpers.extend({
      streams: this.streams
    }, opts || {}));

    helpers.jsonp_factory(this.compare_url(), params, 'meta_', this, fn, error);
    return this;
  };
  
  Compare.prototype.poller = function(opts) {
    return new ComparePoller(this, opts);
  };
  
  return Compare;
});
