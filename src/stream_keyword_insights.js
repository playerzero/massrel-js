define(['./helpers', './generic_poller'], function(helpers, GenericPoller) {
  var _enc = encodeURIComponent;

  function StreamKeywordInsights(stream, defaults) {
    this.stream = stream;
    this.defaults = defaults || {};
  }
  StreamKeywordInsights.prototype.url = function() {
    return this.stream.keyword_insights_url();
  };
  StreamKeywordInsights.prototype.fetch = function(opts, fn, errback) {
    opts = helpers.extend({}, opts || {});
    opts = helpers.extend(opts, this.defaults);

    var params = this.params(opts);
    helpers.request_factory(this.url(), params, '_', this, function(data) {
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
      params.push(['topics', '1']);
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
    if(opts.countries) {
      params.push(['countries', opts.countries]);
    }

    return params;
  };

  return StreamKeywordInsights;
});
