describe('ComparePoller', function () {
  var testParam = function (opts, key, val) {
    var stream = new massrel.Stream('a/b');
    var poller = new massrel.Compare([stream]);
    var params = poller.buildParams(opts);
    if (params.length > 0) {
      expect(key).toEqual(params[0][0]);
      expect(val).toEqual(params[0][1]);
    } else {
      expect(key).toEqual(undefined);
      expect(val).toEqual(undefined);
    }
  };

  it('should whitelist supported parameters', function () {
    testParam({ precision: 4 }, 'precision', 4);
    testParam({ streams: ['a/b'] }, 'streams', ['a/b']);
    testParam({ target: 2000 }, 'target', '2000');
  });
});
