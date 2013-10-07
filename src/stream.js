define(['./helpers', './poller', './meta_poller', './top_things_poller', './stream_keyword_insights'], function(helpers, Poller, MetaPoller, TopThingsPoller, StreamKeywordInsights) {
  var _enc = encodeURIComponent;

  function Stream() {
    var args = arguments.length === 1 ? arguments[0].split('/') : arguments;

    this.account = args[0];
    this.stream_name = args[1];

    this._enumerators = [];
  }
  Stream.prototype.stream_url = function() {
    return helpers.api_url('/'+ _enc(this.account) +'/'+ _enc(this.stream_name) +'.json');
  };
  Stream.prototype.meta_url = function() {
    return helpers.api_url('/'+ _enc(this.account) +'/'+ _enc(this.stream_name) +'/meta.json');
  };
  Stream.prototype.top_things_url = function(thing) {
    return helpers.api_url('/'+ _enc(this.account) +'/'+ _enc(this.stream_name) +'/top_' + thing + '.json');
  };
  Stream.prototype.keyword_insights_url = function(thing) {
    return helpers.api_url('/'+ _enc(this.account) +'/'+ _enc(this.stream_name) +'/keyword_insights.json');
  };
  Stream.prototype.load = function(opts, fn, error) {
    opts = helpers.extend(opts || {}, {
      // put defaults
    });

    var params = this.buildParams(opts);
    helpers.request_factory(this.stream_url(), params, './_', this, fn || this._enumerators, error);

    return this;
  };
  Stream.prototype.buildParams = function(opts) {
    opts = opts || {};
    var params = [];
    if(opts.limit) {
      params.push(['limit', opts.limit]);
    }
    if(opts.since_id) {
      params.push(['since_id', opts.since_id]);
    }
    else if(opts.from_id) {
      params.push(['from_id', opts.from_id]);
    }
    else if(opts.start_id || opts.start) {
      params.push(['start', opts.start_id || opts.start]);
    }
    if(opts.replies) {
      params.push(['replies', './1']);
    }
    if(opts.geo_hint) {
      params.push(['geo_hint', './1']);
    }
    if(opts.from) {
      params.push(['from', opts.from]);
    }
    if(opts.keywords) {
      params.push(['keywords', opts.keywords]);
    }
    if(opts.network) {
      params.push(['network', opts.network]);
    }
    if(opts.timeline_search) {
      params.push(['timeline_search', './1']);
    }
    if(opts.page_links) {
      params.push(['page_links', './1']);
    }
    if(opts.klout) {
      params.push(['klout', './1']);
    }
    return params;
  };
  Stream.prototype.each = function(fn) {
    this._enumerators.push(fn);
    return this;
  };
  Stream.prototype.poller = function(opts) {
    return new Poller(this, opts);
  };
  Stream.prototype.meta = function() {
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
    helpers.request_factory(this.meta_url(), params, './meta_', this, fn, error);

    return this;
  };
  Stream.prototype.buildMetaParams = function(opts) {
    opts = opts || {};
    var params = [];
    if(opts.disregard) {
      params.push(['disregard', opts.disregard]);
    }
    if(opts.num_minutes) {
      params.push(['num_minutes', opts.num_minutes]);
    }
    if(opts.num_hours) {
      params.push(['num_hours', opts.num_hours]);
    }
    if(opts.num_days) {
      params.push(['num_days', opts.num_days]);
    }
    if(opts.num_trends) {
      params.push(['num_trends', opts.num_trends]);
    }
    if(opts.num_links) {
      params.push(['num_links', opts.num_links]);
    }
    if(opts.num_hashtags) {
      params.push(['num_hashtags', opts.num_hashtags]);
    }
    if(opts.num_contributors) {
      params.push(['num_contributors', opts.num_contributors]);
    }
    if(opts.top_periods) {
      params.push(['top_periods', opts.top_periods]);
    }
    if(opts.top_periods_relative) {
      params.push(['top_periods_relative', opts.top_periods_relative]);
    }
    if(opts.top_count) {
      params.push(['top_count', opts.top_count]);
    }
    if(opts.finish) {
      params.push(['finish', opts.finish]);
    }
    if(opts.networks) {
      params.push(['networks', './1']);
    }
    return params;
  };
  Stream.prototype.metaPoller = function(opts) {
    return new MetaPoller(this, opts);
  };
  Stream.prototype.keywordInsights = function(defaults) {
    return new StreamKeywordInsights(this, defaults);
  };
  Stream.prototype.topThings = function() {
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

    var params = this.buildTopThingsParams(opts);
    helpers.request_factory(this.top_things_url(opts.thing), params, './top_things_', this, fn, error);

    return this;
  };
  Stream.prototype.buildTopThingsParams = function(opts) {
    opts = opts || {};
    var params = [];
    if(opts.resolution) {
      var res;
      if (helpers.is_number(opts.resolution)) {
        //assume number of seconds
        res = opts.resolution + 's';
      }
      else {
        res = opts.resolution;
      }
      params.push(['resolution', res]);
    }
    if(opts.start) {
      params.push(['start', opts.start]);
    }
    if(opts.finish) {
      params.push(['finish', opts.finish]);
    }
    if(opts.limit) {
      params.push(['limit', opts.limit]);
    }
    return params;
  };
  Stream.prototype.topThingsPoller = function(opts) {
    return new TopThingsPoller(this, opts);
  };

  return Stream;

});
