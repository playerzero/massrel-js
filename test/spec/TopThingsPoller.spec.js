describe('TopThingsPoller', function () {
  var testParam = function (opts, key, val) {
    var stream = new massrel.Stream('a/b');
    var poller = new massrel.TopThingsPoller(stream, opts);
    var params = stream.buildTopThingsParams(poller.opts);
    if (params.length > 0) {
      expect(key).toEqual(params[0][0]);
      expect(val).toEqual(params[0][1]);
    } else {
      expect(key).toEqual(undefined);
      expect(val).toEqual(undefined);
    }
  };

  it('should pass `start` params through unmodified', function () {
    testParam({ start: 1 }, 'start', 1);
    testParam({ start: 9999999999 }, 'start', 9999999999);
    testParam({ start: '1s' }, 'start', '1s');
    testParam({ start: '1m' }, 'start', '1m');
    testParam({ start: '1h' }, 'start', '1h');
    testParam({ start: '1d' }, 'start', '1d');
    testParam({ start: 'asdf' }, 'start', 'asdf');
    testParam({ start: '10h' }, 'start', '10h');
    testParam({ start: '-10h' }, 'start', '-10h');
  });

  it('should pass `finish` params through unmodified', function () {
    testParam({ finish: 1 }, 'finish', 1);
    testParam({ finish: 9999999999 }, 'finish', 9999999999);
    testParam({ finish: '1s' }, 'finish', '1s');
    testParam({ finish: '1m' }, 'finish', '1m');
    testParam({ finish: '1h' }, 'finish', '1h');
    testParam({ finish: '1d' }, 'finish', '1d');
    testParam({ finish: 'asdf' }, 'finish', 'asdf');
    testParam({ finish: '10h' }, 'finish', '10h');
    testParam({ finish: '-10h' }, 'finish', '-10h');
  });

  it('should pass string `resolution` params through unmodified', function () {
    testParam({ resolution: '5m' }, 'resolution', '5m');
    testParam({ resolution: '1h' }, 'resolution', '1h');
    testParam({ resolution: '1d' }, 'resolution', '1d');
    testParam({ resolution: '10h' }, 'resolution', '10h');
  });

  it('should turn integer `resolution` params into seconds strings', function () {
    testParam({ resolution: 5 }, 'resolution', '5s');
    testParam({ resolution: 300 }, 'resolution', '300s');
    testParam({ resolution: 0 }, 'resolution', '0s');
    testParam({ resolution: 10 }, 'resolution', '10s');
    testParam({ resolution: 9999999999 }, 'resolution', '9999999999s');
  });
});
