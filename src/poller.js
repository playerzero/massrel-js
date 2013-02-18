define(['helpers', 'generic_poller', 'poller_queue'], function(helpers, GenericPoller, PollerQueue) {

  function Poller(stream, opts) {
    GenericPoller.call(this, stream, opts);

    // alias object as streams
    this.stream = this.object;

    // add filter
    this.filter(this.filter_newer);

    var opts = this.opts;
    this.newest_timestamp = opts.newest_timestamp || null;
    this.stay_realtime = 'stay_realtime' in opts ? !!opts.stay_realtime : true;
    this.hail_mary_mode = !!opts.hail_mary_mode;
    this.first = true;
  }

  helpers.extend(Poller.prototype, GenericPoller.prototype);

  // fetch data for Stream
  Poller.prototype.fetch = function(object, opts, cycle) {
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
    var newer_id = this.stay_realtime ? 'since_id' : 'from_id';
    load_opts[newer_id] = self.since_id;

    // create load options
    opts = helpers.extend({}, opts);
    if(this.first) {
      opts = helpers.extend(opts.initial || {}, opts);
      delete opts.initial;
    }
    load_opts = helpers.extend(load_opts, opts);
    
    // remove since_id if the poller
    // is in a mode that prevents cursing
    // the via the API
    if(!this.cursorable()) {
      delete load_opts.since_id;
    }

    object.load(load_opts, function(statuses) {
      if(cycle.enabled()) { // only update cursors if poller cycle enabled
        // only invode hanlders is there are any statuses
        // this is for legacy reasons
        if(statuses && statuses.length > 0) {
          self.since_id = statuses[0].entity_id;

          if(!self.start_id) { // grab last item ID if it has not been set
            self.start_id = statuses[statuses.length - 1].entity_id;
          }
        }
        cycle.callback(statuses);
        self.first = false;
      }
    }, cycle.errback);
    return this;
  };

  // Poller#batch callback will be invoked when there
  // is an array of statuses that is > 0
  // and be invoked with the entire array of statuses
  Poller.prototype.batch = function(fn) {
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

  // the poller is cursorable if no special
  // mode is in place
  Poller.prototype.cursorable = function() {
    return !(GenericPoller.failure_mode || this.failure_mode || this.hail_mary_mode);
  };

  Poller.prototype.filter_newer = function(statuses) {
    statuses = Poller.filter_newer(statuses, this.newest_timestamp);
    if(statuses && statuses.length > 0) {
      this.newest_timestamp = statuses[0].queued_at;
    }
    return statuses;
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
          fn.call(this, statuses);
        }
      }
    }
  };

  Poller.filter_newer = function(statuses, newest_timestamp) {
    var sortable_prop = 'queued_at';
    if(statuses && statuses.length > 0) {
      var limit = this.limit || Infinity;

      // only use statuses the poller hasn't seen before
      if(newest_timestamp) {
        if(statuses[0][sortable_prop] <= newest_timestamp) {
          // if first/newest item in request is equal or older than
          // what the poller knows about, then there are no newer
          // statuses to display
          statuses = [];
        }
        else if(statuses[statuses.length - 1][sortable_prop] > newest_timestamp) {
          // if last/oldest item in request is newer than what the poller knows
          // then all statuses are new. we only care about making sure
          // statuses.length <= limit
          if(statuses.length > limit) {
            statuses.splice(this.limit, statuses.length - limit);
          }
        }
        else {
          // the last status the poller knows about is somewhere inside of the
          // of the requested statuses. grab the statuses that are newer than
          // what the poller knows about until there are no more statuses OR
          // we have collecte limit statuses
          var newerStatuses = [];

          for(var i = 0, len = statuses.length; i < len && newerStatuses.length < limit; i++) {
            var status = statuses[i];
            if(status[sortable_prop] > newest_timestamp) {
              newerStatuses.push(status);
            }
            else {
              break;
            }
          }

          statuses = newerStatuses;
        }
      }
      else if(statuses.length > limit) {
        statuses.splice(this.limit, statuses.length - limit);
      }
    }

    return statuses;
  };

  return Poller;
});
