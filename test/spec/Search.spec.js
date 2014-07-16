describe('Search', function() {
  it('should fetch', function() {
    var old_request_factory = massrel.helpers.request_factory;
    var requestFactorySpy = jasmine.createSpy('requestFactory');
    massrel.helpers.request_factory = requestFactorySpy;

    var search = new massrel.Search();

    var fn = function() {};
    var error = function() {};

    search.fetch({q:'a'}, fn, error);

    expect(requestFactorySpy).toHaveBeenCalled();

    var args = requestFactorySpy.calls.first().args;
    expect(args[1]).toEqual([['q', 'a']]);
    expect(args[3]).toEqual(search);
    expect(args[4]).toEqual(fn);
    expect(args[5]).toEqual(error);

    massrel.helpers.request_factory = old_request_factory;
  });

  it('build params', function() {
    var s = new massrel.Search();

    expect([['q', 'a']]).toEqual(s.buildQueryString({
      q: 'a'
    }));

    expect([['filter.start', '-1h'], ['filter.finish', '0']]).toEqual(s.buildQueryString({
      filters: {
        start: '-1h',
        finish: '0'
      }
    }));

    expect([['view.entities.limit', 1]]).toEqual(s.buildQueryString({
      views: {
        entities: {
          limit: 1
        }
      }
    }));
  });

  it('build query string', function() {
    var s = new massrel.Search();

    expect([['a', 'b']]).toEqual(s.buildParams({
      a: 'b'
    }));

    expect([['a', 'b'], ['a', 'c']]).toEqual(s.buildParams({
      a: ['b', 'c']
    }));

    expect([['a', '1']]).toEqual(s.buildParams({
      a: true
    }));

    expect([['a', '0']]).toEqual(s.buildParams({
      a: false
    }));

    expect([['prefix.a', 'b']]).toEqual(s.buildParams({
      a: 'b'
    }, 'prefix.'));

    expect([['prefix.a', 'b'], ['prefix.a', 'c']]).toEqual(s.buildParams({
      a: ['b', 'c']
    }, 'prefix.'));
  });
});

