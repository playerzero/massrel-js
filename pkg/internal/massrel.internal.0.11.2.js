  /*!
   * massrel/stream-js 0.11.2
   *
   * Copyright 2012 Mass Relevance
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this work except in compliance with the License.
   * You may obtain a copy of the License at:
   *
   *    http://www.apache.org/licenses/LICENSE-2.0
   */
(function () {
define('globals',{
  host: 'tweetriver.com'
, timeout: 10e3
, protocol: document.location.protocol === 'https:' ? 'https' : 'http'
, min_poll_interval: 5e3
, jsonp_param: 'jsonp'
});

define('helpers',['globals'], function(globals) {
  var exports = {}
    , _enc = encodeURIComponent;

  exports.step_through = function(data_list, enumerators, context) {
    data_list = exports.is_array(data_list) ? data_list : [data_list];
    var i = data_list.length - 1;
    if(i >= 0) {
      for(;i >= 0; i--) {
        var status = data_list[i];
        for(var j = 0, len = enumerators.length; j < len; j++) {
          enumerators[j].call(context, status);
        }
      }
    }
  };

  exports.extend = function(to_obj, from_obj) {
    var prop;
    for(prop in from_obj) {
      if(typeof(to_obj[prop]) === 'undefined') {
        to_obj[prop] = from_obj[prop];
      }
    }
    
    return to_obj;
  };

  exports.api_url = function(path, host) {
    // A circular dependency has emerged between massrel and helpers.
    // As much as it pains me to just use massrel off of window, this circular dependency isn't one that could
    // be easily resolved w/ require.
    var host = host || massrel.host,
        port = massrel.port,
        baseUrl = massrel.protocol + '://' + host + (port ? ':' + port : '');

    return baseUrl + path;
  };

  exports.req = {};
  exports.req.supportsCors = (('XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest()) || 'XDomainRequest' in window);
  exports.req.supportsJSON = 'JSON' in window;
  exports.req.xdr = function(url, params, jsonp_prefix, obj, callback, error) {
    var req;

    var success = function(responseText) {
      var data;
      var problems = false;
      try {
        data = JSON.parse(responseText);
      }
      catch(e) {
        problems = true;
        fail(new Error('JSON parse error'));
      }

      if(!problems) {
        if(typeof callback === 'function') {
          callback(data);
        }
        else if(exports.is_array(callback) && callback.length > 0) {
          exports.step_through(data, callback, obj);
        }
      }
    };

    var fail = function(text) {
      if(typeof error === 'function') {
        error(text);
      }
    };

    // check XDomainRequest presence first
    // because newer IE's support XHR object
    // but without CORS
    if(window.XDomainRequest) {
      req = new XDomainRequest();
      req.open('GET', url+'?'+exports.to_qs(params));
      req.onerror = fail;
      req.onprogress = function(){ };
      req.ontimeout = function(){ };
      req.onload = function() {
        success(req.responseText);
      };
      req.send(null);
    }
    else if(window.XMLHttpRequest) {
      req = new XMLHttpRequest();

      req.open('GET', url+'?'+exports.to_qs(params), true);
      req.onerror = fail;
      req.onreadystatechange = function() {
        if (req.readyState === 4) {
          if(req.status >= 200 && req.status < 400) {
            success(req.responseText);
          }
          else {
            fail(new Error('Response returned with non-OK status'));
          }
        }
      };
      req.send(null);
    }
    else {
      fail(new Error('CORS not supported'));
    }
  };

  exports.req.jsonp = function(url, params, jsonp_prefix, obj, callback, error) {
    var callback_id = jsonp_prefix+(++json_callbacks_counter);
    var fulfilled = false;
    var timeout;

    globals._json_callbacks[callback_id] = function(data) {
      if(typeof callback === 'function') {
        callback(data);
      }
      else if(exports.is_array(callback) && callback.length > 0) {
        exports.step_through(data, callback, obj);
      }
      
      delete globals._json_callbacks[callback_id];

      fulfilled = true;
      clearTimeout(timeout);
    };
    params.push([globals.jsonp_param, 'massrel._json_callbacks.'+callback_id]);

    var ld = exports.load(url + '?' + exports.to_qs(params));

    // in 10 seconds if the request hasn't been loaded, cancel request
    timeout = setTimeout(function() {
      if(!fulfilled) {
        globals._json_callbacks[callback_id] = function() {
          delete globals._json_callbacks[callback_id];
        };
        if(typeof error === 'function') {
          error();
        }
        ld.stop();
      }
    }, globals.timeout);
  };

  // alias for backwards compatability
  exports.jsonp_factory = exports.req.jsonp;

  var json_callbacks_counter = 0;
  globals._json_callbacks = {};
  exports.request_factory = function(url, params, jsonp_prefix, obj, callback, error) {
     if(exports.req.supportsCors && exports.req.supportsJSON) {
       exports.req.xdr(url, params, jsonp_prefix, obj, callback, error);
     }
     else {
       exports.req.jsonp(url, params, jsonp_prefix, obj, callback, error);
     }
  };

  exports.is_array = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  var root = document.getElementsByTagName('head')[0] || document.body;
  exports.load = function(url, fn) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // thanks jQuery! stole the script.onload stuff below
    var done = false;
    script.onload = script.onreadystatechange = function() {
      if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
        done = true;
        // handle memory leak in IE
        script.onload = script.onreadystatechange = null;
        if (root && script.parentNode) {
          root.removeChild(script);
        }
        
        if(typeof fn === 'function') {
          fn();
        }
      }
    };

    // use insertBefore instead of appendChild to not efff up ie6
    root.insertBefore(script, root.firstChild);

    return {
      stop: function() {
        script.onload = script.onreadystatechange = null;
        if(root && script.parentNode) {
          root.removeChild(script);
        }
        script.src = "#";
      }
    };
  };

  exports.to_qs = function(params) {
    var query = [], val;
    if(params && params.length) {
      for(var i = 0, len = params.length; i < len; i++) {
        val = params[i][1];
        if(exports.is_array(val)) {
          // copy encoded vals from array into a
          // new array to make sure not to corruept
          // reference array
          var encVals = [];
          for(var j = 0, len2 = val.length; j < len2; j++) {
            encVals[j] = _enc(val[j] || '');
          }
          val = encVals.join(',');
        }
        else if(val !== undefined && val !== null) {
          val = _enc(val);
        }
        else {
          val = '';
        }
        query.push(_enc(params[i][0])+'='+ val);
      }
      return query.join('&');
    }
    else {
      return '';
    }
  };

  var rx_twitter_date = /\+\d{4} \d{4}$/;
  var rx_fb_date = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\+\d{4})$/; // iso8601
  var rx_normal_date = /^(\d{4})-(\d\d)-(\d\d)T(\d\d)\:(\d\d)\:(\d\d)\.(\d{3})Z$/; // iso8601, no offset
  exports.fix_date = exports.fix_twitter_date = function(date) {
    // ensure we're dealing with a string, not a Date object
    date = date.toString();

    if (rx_twitter_date.test(date)) {
      date = date.split(' ');
      var year = date.pop();
      date.splice(3, 0, year);
      date = date.join(' ');
    }
    else if (rx_fb_date.test(date)) {
      date = date.replace(rx_fb_date, '$1/$2/$3 $4:$5:$6 $7');
    }
    else if (rx_normal_date.test(date)) {
      // IE7/8 can't handle the ISO JavaScript date format, so we convert
      date = date.replace(rx_normal_date, '$1/$2/$3 $4:$5:$6 +0000');
    }

    return date;
  };

  exports.parse_params = function() {
    raw = {};
    queryString = window.location.search.substring(1);
    if (queryString.charAt(0) == '?') queryString = queryString.substring(1);
    if (queryString.length > 0){
      queryString = queryString.replace(/\+/g, ' ');
      var queryComponents = queryString.split(/[&;]/g);
      for (var index = 0; index < queryComponents.length; index ++){
        var keyValuePair = queryComponents[index].split('=');
        var key          = decodeURIComponent(keyValuePair[0]);
        var value        = keyValuePair.length > 1
                         ? decodeURIComponent(keyValuePair[1])
                         : '';
        if (!(key in raw)) {
          raw[key] = value;
        } else {
          var existing_val = raw[key];
          if (typeof existing_val != 'string') {
            raw[key].push(value);
          } else {
            raw[key] = [];
            raw[key].push(existing_val);
            raw[key].push(value);
          }
        }
      }
    }
    return raw;
  };

  exports.poll_interval = function(interval) {
    var min = globals.min_poll_interval;
    return Math.max(interval || min, min);
  };

  return exports;
});

define('meta_poller',['helpers'], function(helpers) {

  function MetaPoller(object, opts) {
    var self = this
      , fetch = function() {
          if(enabled) {
            object.meta(self.opts, function(data) { // success
              if(enabled) { // being very thorough in making sure to stop polling when told
                helpers.step_through(data, self._listeners, self);

                if(enabled) { // poller can be stopped in any of the above iterators
                  again();
                }
              }
            }, function() { // error
              again();
            });
          }
        }
      , again = function() {
          tmo = setTimeout(fetch, helpers.poll_interval(self.opts.frequency));
        }
      , enabled = false
      , tmo;

    this._listeners = [];

    this.opts = opts || {};
    
    this.opts.frequency = (this.opts.frequency || 30) * 1000;

    this.start = function() {
      if(!enabled) { // guard against multiple pollers
        enabled = true;
        fetch();
      }
      return this;
    };
    this.stop = function() {
      clearTimeout(tmo);
      enabled = false;
      return this;
    };
  }

  MetaPoller.prototype.data = function(fn) {
    this._listeners.push(fn);
    return this;
  };
  // alias #each
  MetaPoller.prototype.each = MetaPoller.prototype.data;

  return MetaPoller;
});


define('account',['helpers', 'meta_poller'], function(helpers, MetaPoller) {
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
    helpers.request_factory(this.meta_url(), params, 'meta_', this, fn, error);

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
  Account.prototype.metaPoller = function(opts) {
    return new MetaPoller(this, opts);
  };
  Account.prototype.toString = function() {
    return this.user;
  };

  return Account;
});

define('poller_queue',['helpers'], function(helpers) {

  function PollerQueue(poller, opts) {
    this.poller = poller;

    opts = helpers.extend(opts || {}, {
      history_size: 0,
      history_timeout: poller.frequency / 1000
    });

    var queue = [];
    var history = [];
    var callback = null;
    var locked = false;
    var lock_incr = 0;
    var last_history_total = 0;

    this.total = 0;
    this.enqueued = 0;
    this.count = 0;
    this.reused = 0;

    var self = this;
    poller.batch(function(statuses) {
      var len = statuses.length;
      var i = len - 1;
      for(; i >= 0; i--) { // looping through from bottom to top to queue statuses from oldest to newest
        queue.push(statuses[i]);
      }
      self.total += len;
      self.enqueued += len;

      step();
    });

    function check_history() {
      last_history_total = self.total;
      setTimeout(function() {
        if(self.poller.enabled && self.total === last_history_total && history.length > 0 && queue.length === 0) {
          var index = Math.min(Math.floor(history.length * Math.random()), history.length - 1);
          var status = history[index];
          queue.push(status);

          self.total += 1;
          self.enqueued += 1;
          self.reused += 1;

          step();
        };
        check_history();
      }, opts.history_timeout * 1000);
    }
    if(opts.history_size > 0) {
      check_history();
    }

    function step() {
      if(!locked && queue.length > 0 && typeof callback === 'function') {
        var lock_local = ++lock_incr;

        self.enqueued -= 1;
        self.count += 1;
        var status = queue.shift();
        locked = true;

        callback.call(self, status, function() {
          if(lock_local === lock_incr) {
            locked = false;
            setTimeout(step, 0);
          }
        });

        if(opts.history_size > 0 && !status.__recycled) {
          if(opts.history_size === history.length) {
            history.shift();
          }
          status.__recycled = true;
          history.push(status);
        }

      }
    }

    this.next = function(fn) {
      if(!locked && typeof fn === 'function') {
        callback = fn;
        step();
      }
    };
  };

  return PollerQueue;
});

define('poller',['helpers', 'poller_queue'], function(helpers, PollerQueue) {

  function Poller(stream, opts) {
    this.stream = stream;
    this._callbacks = [];
    this._enumerators = [];
    this._bound_enum = false;
    this._t = null;

    opts = opts || {};
    this.limit = opts.limit || null;
    this.since_id = opts.since_id || null;
    this.start_id = opts.start_id || null;
    this.replies = !!opts.replies;
    this.geo_hint = !!opts.geo_hint;
    this.keywords = opts.keywords || null;
    this.frequency = (opts.frequency || 30) * 1000;
    this.stay_realtime = 'stay_realtime' in opts ? !!opts.stay_realtime : true;
    this.network = opts.network || null;
    this.timeline_search = !!opts.timeline_search;
    this.enabled = false;
    this.alive = true;
    this.alive_instance = 0;
    this.consecutive_errors = 0;
  }
  Poller.prototype.poke = function(fn) {
    // this method should not be called externally...
    // it basically restarts the poll loop if it stopped for network errors
    // we call this if a request takes longer than 10sec
    if(!this.alive && this.enabled) {
      this._t = null;
      this.start();
    }
    return this;
  };
  Poller.prototype.batch = function(fn) {
    this._callbacks.push(fn);
    return this;
  };
  Poller.prototype.each = function(fn) {
    this._enumerators.push(fn);
    return this;
  };
  Poller.prototype.start = function() {
    if(this._t) {
      return this;
    }
    this.enabled = true;
    var instance_id = this.alive_instance = this.alive_instance + 1;

    var self = this;
    function poll() {
      self.alive = false;

      if(!self.enabled || instance_id !== self.alive_instance) { return; }

      var load_opts = {};
      if(self.stay_realtime) {
        load_opts.since_id = self.since_id;
      }
      else {
        load_opts.from_id = self.since_id;
      }

      self.stream.load(self.params(load_opts), function(statuses) {
        self.alive = true;
        self.consecutive_errors = 0;

        if(statuses && statuses.length > 0) {
          self.since_id = statuses[0].entity_id;

          if(!self.start_id) { // grab last item ID if it has not been set
            self.start_id = statuses[statuses.length - 1].entity_id;
          }

          // invoke all batch handlers on this poller
          for(var i = 0, len = self._callbacks.length; i < len; i++) {
            self._callbacks[i].call(self, statuses); // we might need to pass in a copy of statuses array
          }

          // invoke all enumerators on this poller
          helpers.step_through(statuses, self._enumerators, self);
        }
        self._t = setTimeout(poll, helpers.poll_interval(self.frequency));
      }, function() {
        self.consecutive_errors += 1;
        self.poke();
      });

    }

    poll();

    return this;
  };
  Poller.prototype.stop = function() {
    clearTimeout(this._t);
    this._t = null;
    this.enabled = false;
    return this;
  };
  Poller.prototype.queue = function(fn) {
    var queue = new PollerQueue(this);
    queue.next(fn);
    return this;
  };
  Poller.prototype.more = function(fn, error) {
    //TODO: build in a lock, so multiple "more" calls
    //are called sequentially instead of in parallel

    var self = this
      , fetch = function() {
          self.stream.load(self.params({
            start_id: self.start_id
          }), function(statuses) {
            if(statuses.length > 0) {
              self.start_id = statuses[statuses.length - 1].entity_id;
              if(!self.since_id) {
                self.since_id = statuses[0].entity_id;
              }

            }
            fn.call(self, statuses);
          }, function() {
            // error
            if(typeof(error) === 'function') {
              error();
            }
          });
        };

    fetch();

    return this;
  };
  Poller.prototype.params = function(opts) {
    return helpers.extend({
      limit: this.limit,
      replies: this.replies,
      geo_hint: this.geo_hint,
      keywords: this.keywords,
      network: this.network,
      timeline_search: this.tiemline_search
    }, opts || {});
  };

  return Poller;
});

define('stream',['helpers', 'poller', 'meta_poller'], function(helpers, Poller, MetaPoller) {
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
  Stream.prototype.load = function(opts, fn, error) {
    opts = helpers.extend(opts || {}, {
      // put defaults
    });

    var params = this.buildParams(opts);
    helpers.request_factory(this.stream_url(), params, '_', this, fn || this._enumerators, error);

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
      params.push(['replies', '1']);
    }
    if(opts.geo_hint) {
      params.push(['geo_hint', '1']);
    }
    if(opts.keywords) {
      params.push(['keywords', opts.keywords]);
    }
    if(opts.network) {
      params.push(['network', opts.network]);
    }
    if(opts.timeline_search) {
      params.push(['timeline_search', '1']);
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
    helpers.request_factory(this.meta_url(), params, 'meta_', this, fn, error);

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
      params.push(['networks', '1']);
    }
    return params;
  };
  Stream.prototype.metaPoller = function(opts) {
    return new MetaPoller(this, opts);
  };

  return Stream;

});

define('context',['helpers'], function(helpers) {

  function Context(status) {
    this.status = status;
    this.source = {
      facebook: false,
      twitter: false,
      google: false,
      instagram: false,
      message: false
    };
    this.known = false;
    this.intents = true;
  }

  Context.create = function(status, opts) {
    status = status || {}; // gracefully handle nulls
    var context = new Context(status);

    opts = helpers.extend(opts || {}, {
      intents: true,
      retweeted_by: true
    });

    context.intents = opts.intents;

    // determine status source
    if(status.id_str && status.text && status.entities) {
      // source: twitter
      context.source.twitter = context.known = true;
    }
    if(status.facebook_id) {
      // source: facebook
      context.source.facebook = true;
      context.known = (typeof(status.message) === 'string');
    }
    else if(status.network === 'google_plus') {
      context.source.google = context.known = true;
    }
    else if(status.network === 'instagram') {
      context.source.instagram = context.known = true;
    }
    else if(status.network === 'massrelevance') {
      // source: internal message
      context.source.message = context.known = true;
    }

    if(context.source.twitter && status.retweeted_status && opts.retweeted_by) {
      context.retweet = true;
      context.retweeted_by_user = status.user;
      context.status =  status.retweeted_status;
    }

    return context;
  };

  return Context;
});

define('compare_poller',['helpers'], function(helpers) {
  function ComparePoller(object, opts) {
    var self = this,
        fetch = function () {
          if (enabled) {
            object.load(self.opts, function(data) {
              if (enabled) {
                helpers.step_through(data, self._listeners, self);
                
                if (enabled) {
                  again();
                }
              }
            }, function() {
              again();
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

define('compare',['helpers', 'compare_poller'], function(helpers, ComparePoller) {
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

    helpers.request_factory(this.compare_url(), params, 'meta_', this, fn, error);
    return this;
  };
  
  Compare.prototype.poller = function(opts) {
    return new ComparePoller(this, opts);
  };
  
  return Compare;
});

define('intents',['helpers'], function(helpers) {

  var intents = {
    base_url: 'https://twitter.com/intent/',
    params: {
      'text'            : '(string): default text, for tweet/reply',
      'url'             : '(string): prefill url, for tweet/reply',
      'hashtags'        : '(string): hashtag (or list with ,) without #, for tweet/reply',
      'related'         : '(string): screen name (or list with ,) without @, available for all',
      'in_reply_to'     : '(number): tweet id, only for reply',
      'via'             : '(string): screen name without @, tweet/reply',
      'tweet_id'        : '(number): tweet id, for retweet and favorite',
      'screen_name'     : '(string): only for user/profile',
      'user_id'         : '(number): only for user/profile',
      'original_referer': '(string): url to display with related ("www.yahoo.com suggests you follow:")'
    },
    // set an original referer if the current page is
    // iframed and there exists a referer
    original_referer:  window.top !== window.self && document.referrer || null
  };

  intents.url = function(type, options) {
    options = options || {};

    // automatically use the referer if user has not set one
    // and we can safetly determine an original referer
    if(options.original_referer === undefined && intents.original_referer) {
      options.original_referer = intents.original_referer;
    }

    var params = [];
    for(var k in options) {
      params.push([k, options[k]]);
    }

    return intents.base_url+encodeURIComponent(type)+'?'+helpers.to_qs(params);
  };

  intents.tweet = function(options) {
    return intents.url('tweet', options);
  };

  intents.reply = function(in_reply_to, options) {
    options = options || {};
    options.in_reply_to = in_reply_to;
    return intents.tweet(options);
  };

  intents.retweet = function(tweet_id, options) {
    options = options || {};
    options.tweet_id = tweet_id;
    return intents.url('retweet', options);
  };

  intents.favorite = function(tweet_id, options) {
    options = options || {};
    options.tweet_id = tweet_id;
    return intents.url('favorite', options);
  };

  intents.user = function(screen_name_or_id, options) {
    options = options || {};
    if(!isNaN(parseInt(screen_name_or_id, 10))) {
      options.user_id = screen_name_or_id;
    }
    else {
      options.screen_name = screen_name_or_id;
    }
    return intents.url('user', options);
  };
  // alias
  intents.profile = intents.user;

  return intents;
});

define('massrel', [
         'globals'
       , 'helpers'
       , 'stream'
       , 'account'
       , 'poller'
       , 'meta_poller'
       , 'poller_queue'
       , 'context'
       , 'compare'
       , 'compare_poller'
       , 'intents'
       ], function(
         globals
       , helpers
       , Stream
       , Account
       , Poller
       , MetaPoller
       , PollerQueue
       , Context
       , Compare
       , ComparePoller
       , intents
       ) {

  var massrel = window.massrel;
  if(typeof(massrel) === 'undefined') {
    massrel = window.massrel = globals;
  } else {
    helpers.extend(massrel, globals);
  }

  // public API
  massrel.Stream = Stream;
  massrel.Account = Account;
  massrel.Poller = Poller;
  massrel.MetaPoller = MetaPoller;
  massrel.PollerQueue = PollerQueue;
  massrel.Context = Context;
  massrel.Compare = Compare;
  massrel.ComparePoller = ComparePoller;
  massrel.helpers = helpers;
  massrel.intents = intents;

  // require/AMD methods
  massrel.define = define;
  massrel.require = require;
  massrel.requirejs = requirejs;

  return massrel;
});

// Go ahead and export the 'massrel' module to 'vendor/massrel', as well, since 
// most places expect it to live there.
define('vendor/massrel', ['massrel'], function(massrel) {
  return massrel;
});
}());