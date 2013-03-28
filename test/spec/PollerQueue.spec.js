describe('PollerQueue', function() {

  function createFakePoller(limit, frequency) {
    var fake_poller = {
      enabled: true,
      limit: limit,
      frequency: frequency,
      batch: function(fn) {
        this._cbs.push(fn);
      },

      _cbs: [],
      _pump: function() {
        var i, len;
        var items = [];
       
        var id = Math.ceil(100000 * Math.random());
        // create fake data
        for(i = 0, len = this.limit; i < len; i++) {
          items.push({ id: id+i, text: 'item '+(i+1) });
        }

        // push to callbacks
        for(i = 0, len = this._cbs.length; i < len; i++) {
          this._cbs[i].call(this, items);
        }
      }
    };

    return fake_poller;
  }

  it('queue up statuses', function() {
    var limit = Math.ceil(20 * Math.random());
    var poller = createFakePoller(limit, 1000);
    var queue = new massrel.PollerQueue(poller);
    poller._pump();

    expect(queue.enqueued).toBe(limit);
  });

  it('iterate through data one a time', function() {
    var limit = Math.ceil(20 * Math.random());
    var poller = createFakePoller(limit, 1000);
    var queue = new massrel.PollerQueue(poller);

    var count = 0;
    function cb(item, next) {
      count++;

      next();
    }

    queue.next(cb);

    poller._pump();
    waits(600);
    setTimeout(function() {
      expect(count).toBe(limit);
      expect(queue.enqueued).toBe(0);
      expect(queue.total).toBe(count);
      poller._pump();
    }, 200);
    setTimeout(function() {
      expect(count).toBe(limit * 2);
      expect(queue.enqueued).toBe(0);
      expect(queue.total).toBe(count);
    }, 500);
  });

  it('prevent multiple iterations if step called multiple times', function() {
    var max_timeout = 1000;
    var poller = createFakePoller(10, 1000);
    var queue = new massrel.PollerQueue(poller);

    var count = 0;
    function cb(item, next) {
      count++;
      if(this.count === 1) {
        next();
        next();
        setTimeout(next, max_timeout * 0.333);
        setTimeout(next, max_timeout * 0.666);
        setTimeout(next, max_timeout * 0.1);
        setTimeout(next, max_timeout * 0.5);
        setTimeout(next, max_timeout * 0.8);
        next();
      }
    }

    queue.next(cb);

    poller._pump();
    setTimeout(function() { 
      expect(count).toBe(2);
      expect(queue.count).toBe(count);
    }, max_timeout);
    waits(max_timeout+200);
  });

  it('total should only be zero if no data is in it', function() {
    var limit = Math.floor(20 * Math.random());
    var poller = createFakePoller(limit, 1000);
    var queue = new massrel.PollerQueue(poller);

    expect(queue.total).toBe(0);
    poller._pump();
    expect(queue.total).toBe(limit);
  });

  it('count tracks of how many statuses have been iterated through', function() {
    var limit = Math.ceil(20 * Math.random());
    var poller = createFakePoller(limit, 1000);
    var queue = new massrel.PollerQueue(poller);

    expect(queue.count).toBe(0);

    var count = 0;
    function cb(item, next) {
      count++;
      expect(queue.count).toBe(count);
      next();
    }

    queue.next(cb);

    poller._pump();
    waits(100);
  });

  it('iterate through data from oldest (bottom) to newest (top)', function() {
    var limit = Math.ceil(20 * Math.random());
    var poller = createFakePoller(limit, 1000);
    var queue = new massrel.PollerQueue(poller);

    var prev_id = -1;
    function cb(item, next) {
      if(prev_id >= 0) {
        expect(prev_id - item.id).toBe(1);
      }
      prev_id = item.id;
      next();
    }

    queue.next(cb);
    poller._pump();
    waits(100);
  });

});
