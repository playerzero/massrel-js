massreljs.define('stream_keyword_insights',['helpers', 'generic_poller'], function(helpers, GenericPoller) {
  var _enc = encodeURIComponent;

  function StreamKeywordInsights(stream, defaults) {
    this.stream = stream;
    this.defaults = defaults || {};
  };
  StreamKeywordInsights.prototype.url = function() {
    return helpers.api_url('/'+ _enc(this.stream.account) +'/'+ _enc(this.stream.stream_name) +'/keyword_insights.json');
  };
  StreamKeywordInsights.prototype.fetch = function(opts, fn, errback) {
    opts = helpers.extend({}, opts || {});
    opts = helpers.extend(opts, this.defaults);

    var params = this.params(opts);
    helpers.request_factory(this.url(), params, '_', this, function(data) {
      if(data && (!opts.verbose || opts.verbose === '0') && helpers.is_array(data.data)) {
        var activity = data.data;
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
  StreamKeywordInsights.prototype.poller = function(opts) {
    var poller = new GenericPoller(this, opts);
    poller.fetch = function(object, opts, cycle) {
      return object.fetch(opts, cycle.callback, cycle.errback);
    };

    return poller;
  };
  StreamKeywordInsights.prototype.params = function(opts) {
    opts = opts || {};
    var params = [];

    if(opts.topics) {
      params.push(['topics', opts.topic]);
    }
    if('start' in opts) {
      params.push(['start', opts.start]);
    }
    if('finish' in opts) {
      params.push(['finish', opts.finish]);
    }
    if(opts.resolution) {
      params.push(['resolution', opts.resolution]);
    }
    params.push(['verbose', 0]);

    return params;
  };

  var predef = function(method, key, value) {
    StreamKeywordInsights.prototype[method] = function() {
      this.defaults[key] = value;
      return this;
    };
  };

  // resolution
  predef('minutes', 'resolution', '1m');
  predef('ten_minutes', 'resolution', '10m');
  predef('hours', 'resolution', '1h');
  predef('days', 'resolution', '1d');


  return StreamKeywordInsights;
});