define(['./globals'], function(globals) {
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
    var host = host || globals.host,
        port = globals.port,
        baseUrl = globals.protocol + '://' + host + (port ? ':' + port : '');

    return baseUrl + path;
  };

  exports.req = {};
  exports.req.supportsXhr2 = 'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest();
  exports.req.supportsCors = (exports.req.supportsXhr2 || 'XDomainRequest' in window);
  exports.req.supportsJSON = 'JSON' in window;
  exports.req.xdr = function(url, params, jsonp_prefix, obj, callback, error) {
    var req;
    var fulfilled = false;
    var timeout;

    var success = function(responseText) {
      fulfilled = true;

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
      fulfilled = true;
      if(typeof error === 'function') {
        error(text);
      }
    };

    // IE9 supports xhr, but not with xhr2 (w/ CORS)
    if(window.XMLHttpRequest && exports.req.supportsXhr2) {
      req = new XMLHttpRequest();
    }
    else if(window.XDomainRequest) {
      req = new XDomainRequest();
    }

    if(req) {
      req.open('GET', url+'?'+exports.to_qs(params));
      req.timeout = globals.timeout;
      req.onerror = fail;
      req.onprogress = function(){ };
      req.ontimeout = fail;
      req.onload = function() {
        success(req.responseText);
      };

      req.send(null);

      timeout = setTimeout(function() {
        if(!fulfilled) {
         req.onerror = function() {};
         req.onprogress = function() {};
         req.ontimeout = function() {};
         req.onload = function() {};
         if(req.abort) {
           req.abort();
         };
         fail();
        }
      }, globals.timeout);
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

  // keep track of last "max" request
  // times and warn dev if more than "max"
  // requests have happened in the last minute
  exports.req.counts = [];
  exports.req.total_counts = 0;
  exports.req.counter = function(throw_error) {
    var now = +(new Date());
    var max = globals.max_reqs_per_min;
    var counts = exports.req.counts;
    var one_minute = 60e3;
    exports.req.total_counts = exports.req.total_counts + 1;

    // this catches a case if "max" value
    // has changed since last counter call
    while(counts.length > max) {
      counts.shift();
    }

    if(counts.length === max) {
      var diff = now - counts[0];
      if(diff < one_minute) {
        var text = 'Warn: requested more than '+max+' times in the last minute ('+exports.req.total_counts+' reqs total)';
        if(throw_error) {
          throw new Error(text);
        }
        else if(window.console && console.warn) {
          console.warn(text);
        }
      }
    }

    while(counts.length >= max) {
      counts.shift();
    }

    counts.push(now);

    return now;
  };


  var json_callbacks_counter = 0;
  globals._json_callbacks = {};
  exports.request_factory = function(url, params, jsonp_prefix, obj, callback, error) {
     exports.req.counter();
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

  exports.is_number = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Number]';
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

  exports.parse_params = function(queryString) {
    queryString = queryString || window.location.search.substring(1);
    var raw = {};
    if (queryString.charAt(0) === '?') {
      queryString = queryString.substring(1);
    }
    if (queryString.length > 0) {
      queryString = queryString.replace(/\+/g, ' ');
      var queryComponents = queryString.split(/[&;]/g);
      for (var index = 0; index < queryComponents.length; index ++){
        var keyValuePair = queryComponents[index].split('=');
        var key = decodeURIComponent(keyValuePair[0]);
        var value = keyValuePair.length > 1 ? decodeURIComponent(keyValuePair[1]) : '';
        if (!(key in raw)) {
          raw[key] = value;
        } else {
          var existing_val = raw[key];
          if (typeof existing_val !== 'string') {
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

  exports.poll_backoff = function(interval, consecutive_errors) {
    var max = globals.max_backoff_interval;
    // use the input interval if is already greater than the backoff
    // max, otherwise apply the backoff
    if(interval < max) {
      consecutive_errors = Math.max(consecutive_errors - 1, 0);
      interval = interval * Math.pow(globals.backoff_rate, consecutive_errors);
      interval = Math.min(interval || max, max);
    }

    return interval;
  };

  // returns a function that can be used to wrap other functions
  // this prevents a function wrapped from being invoked too many
  // times.
  exports.callback_group = function(max_call_count) {
    max_call_count = max_call_count || 1;
    var call_count = 0;
    var active = true;
    var wrapper = function(callback, context) {
      return function() {
        if(active) {
          if(call_count <= max_call_count) {
            return callback.apply(context || this, arguments);
          }
          else {
            throw new Error('Callback group max call count exceeded');
          }
        }
      };
    };

    wrapper.deactivate = function() {
      active = false;
    };

    return wrapper;
  };

  exports.timeParam = function(value, paramName, params, allowZeroOrNegative) {
    if(typeof(value) !== 'undefined') {
      if(value.getTime) {
        value = value.getTime() / 1000;
      }
      
      value = +value;
      if(!isNaN(value) && value > 0) {
        // bucket to closest minute
        value = Math.floor(value / 60) * 60;
        params.push([paramName, value]);
      }
      else if(!isNaN(value) && allowZeroOrNegative && value <= 0) {
        params.push([paramName, value]);
      }

    }
  };

  /*
   * takes a list of $.Deferred objects or a single $.Deferred object and returns a promise
   * the promise will be resolved when all the deferreds are no longer pending (i.e. resolved or rejected)
   * this is very similar to $.when, except that $.when will reject the promise if any of the deferreds are rejected
   */
  exports.always = function(deferreds) {
    var deferred = new $.Deferred();
    if (deferreds === undefined) {
      deferred.resolve();
      return deferred.promise();
    }

    if (deferreds.length === undefined) {
      deferreds = [deferreds];
    }

    var remaining = deferreds.length;

    var callback = function() {
      remaining--;
      if (remaining === 0) {
        deferred.resolve();
      }
    };

    $.each(deferreds, function() {
      this.always(callback);
    });

    return deferred.promise();
  };

  return exports;
});
