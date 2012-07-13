define(['helpers', 'generic_poller', 'poller_queue'], function(helpers, GenericPoller, PollerQueue) {

  function Poller() {
    GenericPoller.apply(this, arguments);

    this.since_id = this.opts.since_id || null;
    this.start_id = this.opts.start_id || null;
    this.stay_realtime = 'stay_realtime' in this.opts ? !!this.opts.stay_realtime : true;
  }

  helpers.extend(Poller.prototype, GenericPoller.prototype);

  // fetch data for Stream
  Poller.prototype.fetch = function(object, opts, skip, callback, error) {
    var self = this;
    var load_opts = {
      // prevents start_id from being include in query
      start_id: null
    };

    // if in "stay realtime" mode then
    // then poller should use "since_id"
    //
    // "since_id" gets statuses from the newest item in a stream
    // to "since_id" (exclusive) or until "limit" is reached.
    // statuses will be skipped in order to stay realtime
    //
    // "from_id" gets statuses from the provided id newer until
    // the newest status in stream is found or until "limit" is reached.
    // all statuses in a stream will be downloaded but it is likely
    // to not stay realtime
    if(this.stay_realtime) {
      load_opts.since_id = self.since_id;
    }
    else {
      load_opts.from_id = self.since_id;
    }

    object.load(helpers.extend(load_opts, opts), function(statuses) {
      // only invode hanlders is there are any statuses
      // this is for legacy reasons
      if(statuses && statuses.length > 0) {
        self.since_id = statuses[0].entity_id;

        if(!self.start_id) { // grab last item ID if it has not been set
          self.start_id = statuses[statuses.length - 1].entity_id;
        }
      }
      callback.apply(self, arguments);
    }, error);
    return this;
  };

  // Poller#batch callback will be invoked when there
  // is an array of statuses that is > 0
  // and be invoked with the entire array of statuses
  Poller.prototype.each = function(fn) {
    return this.data(Poller.createEnumerator(fn, false));
  };

  // Poller#each callback will be invoked when there
  // is an array of statuses that is > 0
  // and be invoked once for each item in the array
  // from oldest status to newest statuse
  Poller.prototype.each = function(fn) {
    return this.data(Poller.createEnumerator(fn, true));
  };

  // creates a new queue with the poller
  Poller.prototype.queue = function() {
    var queue = new PollerQueue(this);
    queue.next(fn);
    return this;
  };

  // gets "olders" statuses at bottom of stream
  // and knows how to cursor down without getting duplicates
  Poller.prototype.more = function(fn, error) {
    //TODO: build in a lock, so multiple "more" calls
    //are called sequentially instead of in parallel

    var self = this,
        fetch = function() {
          self.object.fetch(helpers.extend({
            start_id: self.start_id,

            // prevent since_id from being included in query
            since_id: null
          }, self.opts), function(statuses) {
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

  // legacy method that used to "kick start"
  // a poller is there were network isssues
  // I handle this at the request level now
  // but leave as noop (basically) for now
  Poller.prototype.poke = function() { return this; };

  // creates an handler that will
  // invoke the given handler once for each tweet in the response
  // it will also only invoke given handler is there are 1 or more statuses (for legacy reasons)
  Poller.createEnumerator = function(fn, enumerateEach) {
    if(enumerateEach) {
      return function(statuses) {
        if(statuses && statuses.length > 0) {
          // strep through will invote the handler (fn)
          // from the oldest tweet (data.last) to the newest (data.first)
          helpers.step_through(statuses, [fn], this);
        }
      };
    }
    else {
      return function(statuses) {
        if(statuses && statuses.length > 0) {
          fn.apply(this, statuses);
        }
      }
    }
  };

  return Poller;
});
