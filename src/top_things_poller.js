define(['./helpers', './generic_poller'], function(helpers, GenericPoller) {

  /*
   * a relative time string is a string like '300s' or '5m' or '24h' or '30d'.
   *
   * available opts:
   *   start: string|integer - relative time string or unix timestamp in
   *     seconds - lower bound on time of first bucket
   *   finish: string|integer - relative time string or unix timestamp in
   *     seconds - upper bound on time of last bucket
   *   resolution: string|integer - the size of each bucket as a relative time
   *     string, or as an integer number of seconds. must be divisble by 5
   *     minutes.
   *   limit: integer - the maximum number of things in each bucket
   *   thing: string - 'hashtags'|'urls'|'terms' - the thing that you want
   *     counts of
   */
  function TopThingsPoller (object, opts) {
    opts.thing = opts.thing || 'hashtags';
    GenericPoller.apply(this, arguments);
  }

  helpers.extend(TopThingsPoller.prototype, GenericPoller.prototype);

  TopThingsPoller.prototype.fetch = function (object, opts, cycle) {
    object.topThings(opts, cycle.callback, cycle.errback);
    return this;
  };

  // convenience method for finding the most recent non-empty bucket
  TopThingsPoller.mostRecentBucket = function (data) {
    if (data.data && data.data.length > 0) {
      // find most recent bucket with data if one exists
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

