describe('helpers', function() {



  describe('building a query string', function() {
    var to_qs = massrel.helpers.to_qs;

    it('handle nothing gracfully', function() {
      expect(to_qs()).toEqual('');
    });

    it('preserve multiple params order', function() {
      var qs = to_qs([
        ['key1', 'val1'],
        ['key2', 'val2']
      ]);
      
      expect(qs).toEqual('key1=val1&key2=val2');
    });

    it('have an empty value for keys without values', function() {
      var qs = to_qs([
        ['key1'],
        ['key2']
      ]);
      
      expect(qs).toEqual('key1=&key2=');
    });

    it('escape each item of an array and put a comma between them', function() {
      var qs = to_qs([
        ['key1', ['a', '#b', 'c']]
      ]);
      expect(qs).toEqual('key1=a,%23b,c');

      var qs = to_qs([
        ['key1', new Array(4)]
      ]);
      expect(qs).toEqual('key1=,,,');

    });

  });

  describe('fixing twitter dates', function() {
    // using 2009 so we can test that it is not now
    var twitter_date = 'Tue Aug 02 22:05:13 +0000 2009';
    var to_date = 'Tue Aug 02 2009 22:05:13 +0000';

    it('should move the year from the end of a twitter JSON', function() {
      
      expect(massrel.helpers.fix_twitter_date(twitter_date)).toEqual(to_date);
    });

    it('should be able to be a real Date object', function() {
      var from_date = new Date(massrel.helpers.fix_twitter_date(twitter_date));
      var compare_to = new Date(to_date);

      expect(from_date.getFullYear()).toEqual(2009);

      expect(from_date.getTime()).toEqual(compare_to.getTime());
    });

  });

  describe('checking if something is an array', function() {
    var is_array = massrel.helpers.is_array;

    it('an array is an array', function() {
      expect(is_array([])).toEqual(true);
    });

    it('an object is not an array', function() {

      expect(is_array({})).toEqual(false);
      expect(is_array(1)).toEqual(false);
      expect(is_array(null)).toEqual(false);
      expect(is_array('test')).toEqual(false);
      expect(is_array(undefined)).toEqual(false);

    });
  });

});
