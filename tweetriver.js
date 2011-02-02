(function() {
  var tweetriver = window.tweetriver = {};
  tweetriver.host = 'tweetriver.com';

  var json_callbacks_counter = 0;

  function Stream() {
    var args = arguments.length === 1 ? arguments[0].split('/') : arguments;
    
    this.account = args[0];
    this.stream_name = args[1];
    
    this._enumerators = [];
  }
  Stream.prototype.stream_url = function() {
    return 'http://'+ tweetriver.host +'/' + encodeURIComponent(this.account) + '/'+ encodeURIComponent(this.stream_name) +'.json';
  };
  Stream.prototype.meta_url = function() {
    return 'http://'+ tweetriver.host +'/' + encodeURIComponent(this.account) + '/'+ encodeURIComponent(this.stream_name) +'/meta.json';
  };
  Stream.prototype.load = function(opts, fn) {
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
    
    var self = this;
    var callback_id = ++json_callbacks_counter;
    Stream._json_callbacks[callback_id] = function(tweets) {
      if(typeof fn === 'function') {
        fn(tweets);
      }
      else if(this._enumerators.length > 0) {
        Stream.step_through(tweets, this._enumerators, self);
      }
      
      delete Stream._json_callbacks[callback_id];
    };
    params.push(['jsonp', 'tweetriver.Stream._json_callbacks['+callback_id+']']);
    
    load(this.stream_url() + '?' + to_qs(params));
    
    return this;
  };
  Stream.prototype.each = function(fn) {
    this._enumerators.push(fn);
    return this;
  };
  Stream.prototype.poller = function(opts) {
    return new Poller(this, opts);
  };
  Stream.prototype.meta = function(fn) {
    var params = [];
    
    var self = this;
    var callback_id = ++json_callbacks_counter;
    Stream._json_callbacks[callback_id] = function(data) {
      fn.call(self, data);
      
      delete Stream._json_callbacks[callback_id];
    };
    params.push(['jsonp', 'tweetriver.Stream._json_callbacks['+callback_id+']']);
    
    load(this.meta_url() + '?' + to_qs(params));
    
    return this;
  };
  Stream.step_through = function(tweets, enumerators, context) {
    var i = tweets.length - 1;
    if(i > 0) {
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
    this.frequency = (opts.frequency || 30) * 1000;
  }
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
    
    var self = this;
    function poll() {
      self.stream.load({
        limit: self.limit,
        since_id: self.since_id
      }, function(tweets) {
        if(tweets.length > 0) {
          self.since_id = tweets[0].order_id;
          
          // invoke all bacth handlers on this poller
          for(var i = 0, len = self._callbacks.length; i < len; i++) {
            self._callbacks[i].call(self, tweets);
          }
          
          // invoke all enumerators on this poller
          Stream.step_through(tweets, self._enumerators, self);
        }

        self._t = setTimeout(poll, self.frequency);
      });
    }
    
    poll();
    
    return this;
  };
  Poller.prototype.stop = function() {
    clearTimeout(this._t);
    this._t = null;
    return this;
  };
  Poller.prototype.queue = function(fn) {
    var queue = new PollerQueue(this);
    queue.next(fn);
    return this;
  }
  
  function PollerQueue(poller, opts) {
    this.poller = poller;
    
    opts = opts || {};
    
    var queue = [];
    var callback = null;
    var locked = false;
    
    var self = this;
    poller.batch(function(tweets) {
      var i = tweets.length - 1;
      for(; i >= 0; i--) {
        queue.push(tweets[i]);
      }
      
      step();
    });
    
    function step() {
      if(!locked && queue.length > 0 && typeof callback === 'function') {
        var tweet = queue.shift();
        locked = true
        callback.call(this, tweet, function() {
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
  function load(url) {
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
      }
    };

    // use insertBefore instead of appendChild to not efff up ie6
    root.insertBefore(script, root.firstChild);
  };
  
  function to_qs(params) {
    var enc = encodeURIComponent;
    var query = [];
    for(var i = 0, len = params.length; i < len; i++) {
      query.push(enc(params[i][0]) + (params[i][1] !== undefined ? '='+enc(params[i][1]) : ''));
    }
    return query.join('&');
  }
  
  function extend(to_obj, from_obj) {
    for(prop in from_obj) {
      if(!(prop in to_obj)) {
        to_obj[prop] = from_obj[prop];
      }
    }
    
    return to_obj;
  }
  
  
  // public api
  window.tweetriver = {
    Stream: Stream,
    Poller: Poller,
    PollerQueue: PollerQueue
  };
  
})();