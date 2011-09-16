(function() {
  var massrel = window.massrel = window.massrel || {};
  massrel.host = 'tweetriver.com';
  massrel.timeout = 10 * 1000;

  var _enc = encodeURIComponent;
  var json_callbacks_counter = 0;

  function Stream() {
    var args = arguments.length === 1 ? arguments[0].split('/') : arguments;
    
    this.account = args[0];
    this.stream_name = args[1];
    
    this._enumerators = [];
  }
  Stream.prototype.stream_url = function() {
    return 'http://'+ massrel.host +'/' + _enc(this.account) + '/'+ _enc(this.stream_name) +'.json';
  };
  Stream.prototype.meta_url = function() {
    return 'http://'+ massrel.host +'/' + _enc(this.account) + '/'+ _enc(this.stream_name) +'/meta.json';
  };
  Stream.prototype.load = function(opts, fn, error) {
    opts = extend(opts || {}, {
      // put defaults
    });
    
    var params = [];
    if(opts.limit) {
      params.push(['limit', opts.limit]);
    }
    if(opts.since_id) {
      params.push(['since_id', opts.since_id]);
    }
    if(opts.replies) {
      params.push(['replies', opts.replies]);
    }
    if(opts.geo_hint) {
      params.push(['geo_hint', opts.geo_hint]);
    }

    jsonp_factory(this.stream_url(), params, '_', this, fn || this._enumerators, error); 

    return this;
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
    
    var params = [];
    if(opts.disregard) {
      params.push(['disregard', opts.disregard]);
    }

    jsonp_factory(this.meta_url(), params, 'meta_', this, fn, error);
    
    return this;
  };
  Stream.step_through = function(tweets, enumerators, context) {
    var i = tweets.length - 1;
    if(i >= 0) {
      for(;i >= 0; i--) {
        var tweet = tweets[i];
        for(var j = 0, len = enumerators.length; j < len; j++) {
          enumerators[j].call(context, tweet);
        }
      }
    }
  };
  Stream._json_callbacks = {};
  
  function Poller(stream, opts) {
    this.stream = stream;
    this._callbacks = [];
    this._enumerators = [];
    this._bound_enum = false;
    this._t = null;
    
    opts = opts || {};
    this.limit = opts.limit || null;
    this.since_id = opts.since_id || null;
    this.replies = opts.replies || null;
    this.geo_hint = opts.geo_hint || null;
    this.frequency = (opts.frequency || 30) * 1000;
    this.catch_up = opts.catch_up !== undefined ? opts.catch_up : false;
    this.enabled = false;
    this.alive = true;
    this.alive_instance = 0;
    this.consecutive_errors = 0;
  }
  Poller.prototype.poke = function(fn) {
    // this method should not be called externally...
    // it basically restarts the poll loop if it stopped for network errors
    // we call this if a request takes longer than 10sec
    if(this.alive == false) {
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

      self.stream.load({
        limit: self.limit,
        since_id: self.since_id,
        replies: self.replies,
        geo_hint: self.geo_hint
      }, function(tweets) {
        self.alive = true;
        self.consecutive_errors = 0;
        var catch_up = self.catch_up && tweets.length === self.limit;
        
        if(tweets.length > 0) {
          self.since_id = tweets[0].id_str;
          
          // invoke all batch handlers on this poller
          for(var i = 0, len = self._callbacks.length; i < len; i++) {
            self._callbacks[i].call(self, tweets); // we might need to pass in a copy of tweets array
          }
          
          // invoke all enumerators on this poller
          Stream.step_through(tweets, self._enumerators, self);
        }
        self._t = setTimeout(poll, catch_up ? 0 : self.frequency);
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
  
  function PollerQueue(poller, opts) {
    this.poller = poller;
    
    opts = opts || {};
    
    var queue = [];
    var callback = null;
    var locked = false;

    this.total = 0;
    this.enqueued = 0;
    
    var self = this;
    poller.batch(function(tweets) {
      var len = tweets.length;
      var i = len - 1;
      for(; i >= 0; i--) { // looping through from bottom to top to queue tweets from oldest to newest
        queue.push(tweets[i]);
      }
      self.total += len;
      self.enqueued += len;
      
      step();
    });
    
    function step() {
      if(!locked && queue.length > 0 && typeof callback === 'function') {
        self.enqueued -= 1;
        var tweet = queue.shift();
        locked = true
        callback.call(self, tweet, function() {
          locked = false;
          setTimeout(step, 0);
        });
      }
    }
    
    this.next = function(fn) {
      if(!locked && typeof fn === 'function') {
        callback = fn;
        step();
      }
    }
  };
  
  
  // UTILS
  
  var root = document.getElementsByTagName('head')[0] || document.body;
  function load(url, fn) {
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

  function jsonp_factory(url, params, jsonp_prefix, obj, callback, error) {
    var callback_id = jsonp_prefix+(++json_callbacks_counter);
    var fulfilled = false;
    var timeout;

    Stream._json_callbacks[callback_id] = function(data) {
      if(typeof callback === 'function') {
        callback(data);
      }
      else if(is_array(callback) && callback.length > 0) {
        Stream.step_through(data, callback, obj);
      }
      
      delete Stream._json_callbacks[callback_id];

      fulfilled = true;
      clearTimeout(timeout);
    };
    params.push(['jsonp', 'massrel.Stream._json_callbacks.'+callback_id]);

    var ld = load(url + '?' + to_qs(params));

    // in 10 seconds if the request hasn't been loaded, cancel request
    timeout = setTimeout(function() {
      if(!fulfilled) {
        Stream._json_callbacks[callback_id] = function() {
          delete Stream._json_callbacks[callback_id];
        };
        if(typeof error === 'function') {
          error();
        }
        ld.stop();
      }
    }, massrel.timeout);
  }
  
  function to_qs(params) {
    var query = [], val;
    if(params && params.length) {
      for(var i = 0, len = params.length; i < len; i++) {
        val = params[i][1];
        if(is_array(val)) {
          for(var j = 0, len2 = val.length; j < len2; j++) {
            val[j] = _enc(val[j] || '');
          }
          val = val.join(',');
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
  }
  
  function extend(to_obj, from_obj) {
    for(prop in from_obj) {
      if(typeof(to_obj[prop]) === 'undefined') {
        to_obj[prop] = from_obj[prop];
      }
    }
    
    return to_obj;
  }

  var is_array = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  var rx_twitter_date = /\+\d{4} \d{4}$/;
  var rx_fb_date = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\+\d{4})$/; // iso8601
  function fix_date(date) {
    if(rx_twitter_date.test(date)) {
      date = date.split(' ');
      var year = date.pop();
      date.splice(3, 0, year);
      date = date.join(' ');
    }
    else if(rx_fb_date.test(date)) {
      date = date.replace(rx_fb_date, '$1/$2/$3 $4:$5:$6 $7');
    }
    return date;
  };
  
  function parse_params() {
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
  }

  
  // public api
  massrel.Stream = Stream;
  massrel.Poller = Poller;
  massrel.PollerQueue = PollerQueue;
  massrel.helpers = {
    load: load,
    jsonp_factory: jsonp_factory,
    to_qs: to_qs,
    extend: extend,
    is_array: is_array,
    fix_date: fix_date,
    fix_twitter_date: fix_date, // alias
    parse_params: parse_params
  };
  
})();
