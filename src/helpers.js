define(['globals'], function(globals) {
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

  var json_callbacks_counter = 0;
  globals._json_callbacks = {};
  exports.jsonp_factory = function(url, params, jsonp_prefix, obj, callback, error) {
    var callback_id = jsonp_prefix+(++json_callbacks_counter);
    var fulfilled = false;
    var timeout;

    globals._json_callbacks[callback_id] = function(data) {
      if(typeof callback === 'function') {
        callback(data);
      }
      else if(exports.is_array(callback) && callback.length > 0) {
        helpers.step_through(data, callback, obj);
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
