define(['helpers'], function(helpers) {
  var _enc = encodeURIComponent;

  function Account(user) {
    this.user = user;
  }
  Account.prototype.meta_url = function() {
    return helpers.api_url('/'+ _enc(this.user) +'.json');
  };
  Account.prototype.meta = function() {
    var opts, fn, error;
    if(typeof(arguments[0]) === 'function') {
      fn = arguments[0];
      error = arguments[1];
      opts = {};
    }
    else if(typeof(arguments[0]) === 'object') {
      opts = arguments[0];
      fn = arguments[1];
      error = arguments[2];
    }
    else {
      throw new Error('incorrect arguments');
    }

    var params = this.buildMetaParams(opts);
    helpers.jsonp_factory(this.meta_url(), params, 'meta_', this, fn, error);

    return this;
  };
  Account.prototype.buildMetaParams = function(opts) {
    opts = opts || {};

    var params = [];
    if(opts.quick_stats) {
      params.push(['quick_stats', '1']);
    }
    if(opts.streams) {
      var streams = helpers.is_array(opts.streams) ? opts.streams : [opts.streams];
      params.push(['streams', streams.join(',')]);
    }

    return params;
  };
  Account.prototype.toString = function() {
    return this.user;
  };

  return Account;
});
