describe('AMD Module', function() {

  it('define as "massrel" module', function() {
    var loaded = false;
    waitsFor(function() {
      return loaded;
    });

    // make sure to use a relative path
    // to the built massrel lib without
    // the extensiont (i.e. .js)
    relative_path = '../massrel';

    require([relative_path], function(lib) {
      expect(lib).toEqual(window.massrel);
      loaded = true;
    });
  });

});
