define(['helpers', 'generic_poller'], function(helpers, GenericPoller) {

  var timestampNow = function() {
    return Math.floor((new Date()).getTime() / 1000);
  };

  var computeResolution = function(start, finish) {
    var res = finish - start;
    //round to multiple of 5 minutes (300 seconds)
    if (res % 300 !== 0) {
      res = Math.max(1, Math.round(res / 300)) * 300;
    }
    return res;
  };

  var units = /[smh]/;
  var unitMultipliers = {
    s: 1,
    m: 60,
    h: 3600
  };

  var convertToSeconds = function(time) {
    if (helpers.is_number(time)) {
      return time;
    }

    var num = window.parseInt(time);
    if (!num && num !== 0) {
      return 0;
    }

    time = time.toLowerCase();
    var unit = units.exec(time);
    if (unit === null || unitMultipliers[unit] === undefined) {
      return num;
    }

    return num * unitMultipliers[unit];
  };

  /*
   * available opts:
   *   start: integer - unix timestamp or relative time in seconds - lower bound on time of first bucket
   *   finish: integer - unix timestamp or relative time in seconds - upper bound on time of last bucket
   *   resolution: string|integer - the size of each bucket. must be divisble by 5 minutes. can be specified in seconds, minutes, hours. e.g. 300s, 5m, 1h
   *   limit: integer - the maximum number of things in each bucket
   *   thing: string - 'hashtags'|'urls'|'terms' - the thing that you want counts of
   */
  function TopThingsPoller(object, opts) {
    if (opts.thing === undefined) {
      opts.thing = 'hashtags';
    }
    if (opts.start !== undefined) {
      opts.start = convertToSeconds(opts.start);
    }
    if (opts.finish !== undefined) {
      opts.finish = convertToSeconds(opts.finish);
    }
    if (opts.resolution !== undefined) {
      opts.resolution = convertToSeconds(opts.resolution);
    }

    GenericPoller.apply(this, arguments);
  }

  helpers.extend(TopThingsPoller.prototype, GenericPoller.prototype);

  TopThingsPoller.prototype.fetch = function(object, opts, cycle) {
    if (opts.start !== undefined && opts.start <= 0) {
      //compute timestamp from relative time
      opts.start = timestampNow() + opts.start;
    }
    if (opts.finish !== undefined && opts.finish <= 0) {
      //compute timestamp from relative time
      opts.finish = timestampNow() + opts.finish;
    }
    if (opts.resolution === undefined) {
      opts.resolution = computeResolution(opts.start, opts.finish);
    }
    
    object.topThings(opts, cycle.callback, cycle.errback);
    return this;
  };

  //convenience method for finding the most recent non-empty bucket
  TopThingsPoller.mostRecentBucket = function(data) {
    if (data.data !== undefined && data.data.length > 0) {
      //find most recent bucket with data if one exists
      for (var i = data.data.length - 1; i >= 0; i--) {
        if (data.data[i].things && data.data[i].things.length > 0) {
          return data.data[i];
        }
      }
      if (i === -1) {
        return data.data[data.data.length - 1];
      }
    }
    return null;
  };

  // alias
  TopThingsPoller.prototype.each = TopThingsPoller.prototype.data;

  return TopThingsPoller;
});

