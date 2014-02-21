define(['./helpers', './generic_poller'], function(helpers, GenericPoller) {
  var _enc = encodeURIComponent;

  function StreamActivity(stream, defaults) {
    this.stream = stream;
    this.defaults = defaults || {};
  }
  StreamActivity.prototype.url = function() {
    return helpers.api_url('/'+ _enc(this.stream.account) +'/'+ _enc(this.stream.stream_name) +'/activity.json');
  };
  StreamActivity.prototype.fetch = function(opts, fn, errback) {
    opts = helpers.extend({}, opts || {});
    opts = helpers.extend(opts, this.defaults);

    var params = this.params(opts);
    helpers.request_factory(this.url(), params, '_', this, function(data) {
      if(data && (!opts.verbose || opts.verbose === '0') && helpers.is_array(data.activity)) {
        var activity = data.activity;
        for(var i = 0, len = activity.length; i < len; i++) {
          var start = data.start + (data.period_size * i);
          activity[i] = helpers.extend(activity[i], {
            start: start,
            finish: Math.min(start + data.period_size, data.finish)
          });
        }
      }
      if(typeof(fn) === 'function') {
        fn.apply(this, arguments);
      }
    }, errback);
    return this;
  };
  StreamActivity.prototype.poller = function(opts) {
    var poller = new GenericPoller(this, opts);
    poller.fetch = function(object, opts, cycle) {
      return object.fetch(opts, cycle.callback, cycle.errback);
    };

    return poller;
  };
  StreamActivity.prototype.params = function(opts) {
    opts = opts || {};
    var params = [];

    if(opts.view) {
      params.push(['view', opts.view]);
    }
    else if(opts.topic) {
      params.push(['topic', opts.topic]);
    }
    helpers.timeParam(opts.start, 'start', params, true);
    helpers.timeParam(opts.finish, 'finish', params, true);
    if('periods' in opts) {
      params.push(['periods', opts.periods]);
    }
    if(opts.resolution) {
      params.push(['resolution', opts.resolution]);
    }
    if('tz_offset' in opts) {
      params.push(['tz_offset', opts.tz_offset]);
    }
    if(opts.encode) {
      params.push(['encode', opts.encode]);
    }
    params.push(['verbose', 0]);

    return params;
  };

  var predef = function(method, key, value) {
    StreamActivity.prototype[method] = function() {
      this.defaults[key] = value;
      return this;
    };
  };

  // view
  predef('approved', 'view', 'approved');
  predef('pending', 'view', 'pending');
  predef('rejected', 'view', 'rejected');

  // resolution
  predef('minutes', 'resolution', '1m');
  predef('ten_minutes', 'resolution', '10m');
  predef('hours', 'resolution', '1h');
  predef('days', 'resolution', '1d');


  return StreamActivity;

});
