describe('AMD Module', function() {

  it('define as "massrel" module', function() {
    require(['massrel'], function(lib) {
      expect(lib).toEqual(window.massrel);
    });

    waits(200);
  });

  it('define as "vendor/massrel" module', function() {
    require(['vendor/massrel'], function(lib) {
      expect(lib).toEqual(window.massrel);
    });

    waits(200);
  });

});
