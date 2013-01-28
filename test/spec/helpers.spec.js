describe('helpers', function() {

  describe('load script', function() {
    var load = massrel.helpers.load;
    
    it('callback is successful and work cross domain', function() {
      var url = 'http://pipes.yahoo.com/pipes/pipe.run?_id=c4fb5175c000f1e19e244bba36aca1e8&_render=json&_callback=loadtest';

      var loadtest = window.loadtest = jasmine.createSpy();
      var callback = jasmine.createSpy();

      load(url, callback);

      setTimeout(function() {
        expect(loadtest).toHaveBeenCalled();
        expect(callback).toHaveBeenCalled();
      }, 1500);
    });

    waits(1500);
  });

  describe('building jsonp requests', function() {

    massrel._json_callbacks = {};

    var callbacksBefore = 0;
    for(var k in massrel._json_callbacks) {
      callbacksBefore += 1;
    }

    var scope = {};
    var params = [];
    var prefix = '_textprefix_';

    it('pass data to callback', function() {
      var callback = jasmine.createSpy('success');
      var error = jasmine.createSpy('error');

      var limit = Math.max( Math.ceil( Math.random() * 10 ), 1);
      var params = [['limit', limit]];
      massrel.helpers.req.jsonp('http://tweetriver.com/massrelevance/glee.json', params, prefix, {}, callback, error);

      setTimeout(function() {
        expect(callback).toHaveBeenCalled();
        expect(callback.mostRecentCall.args[0].length).toEqual(limit);

        expect(error).not.toHaveBeenCalled();
      }, 1500);

    });

    waits(1500);

    it('timeout if taking too long', function() {
      var timeout = massrel.timeout;
      massrel.timeout = 100;

      var callback = jasmine.createSpy('success');
      var error = jasmine.createSpy('error');
      
      massrel.helpers.req.jsonp('http://localhost:9876/fakeurl', params, prefix, {}, callback, error);

      setTimeout(function() {
        expect(callback).not.toHaveBeenCalled();
        expect(error).toHaveBeenCalled();
      }, 500);

      massrel.timeout = timeout;
    });

    waits(1000);

    it('add new callback to public jsonp hash', function() {
      var callbacksAfter = 0;
      for(var k in massrel._json_callbacks) {
        callbacksAfter += 1;
      }
      expect(callbacksAfter - callbacksBefore).toEqual(1);
    });

    it('use given prefix for jsonp method', function() {
      for(var k in massrel._json_callbacks) {
        expect(k.indexOf(prefix)).toBeGreaterThan(-1);
      }
    });

    it('auto add jsonp param to url', function() {
      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual('jsonp');
    });

    it('use a different jsonp param if changed', function() {
      var old_param = massrel.jsonp_param;
      massrel.jsonp_param = 'callback';

      var params = [];
      massrel.helpers.req.jsonp('http://tweetriver.com/massrelevance/glee.json', params, prefix, {}, function() {}, function() {});

      expect(params.length).toEqual(1);
      expect(params[0][0]).toEqual(massrel.jsonp_param);

      massrel.jsonp_param = old_param;
    });

    it('uses helpers.jsonp_factory as an alias', function() {
      expect(massrel.helpers.jsonp_factory).toEqual(massrel.helpers.req.jsonp);
    });

  });

  describe('building CORS requests', function(useCors, supportsCors, supportsJSON) {
    
    var testCors = function() {
      var old_xdr = massrel.helpers.req.xdr;
      var old_jsonp = massrel.helpers.req.jsonp;
      var old_cors = massrel.helpers.req.supportsCors;
      var old_json = massrel.helpers.req.cupportsJSON;

      massrel.helpers.req.supportsCors = supportsCors;
      massrel.helpers.req.supportsJSON = supportsJSON;

      massrel.helpers.req.xdr = jasmine.createSpy('fakeXdr');
      massrel.helpers.req.jsonp = jasmine.createSpy('jsonp');
      massrel.helpers.request_factory('http://tweetriver.com/test/');

      if(useCors) {
        expect(massrel.helpers.req.xdr).toHaveBeenCalled();
        expect(massrel.helpers.req.jsonp).not.toHaveBeenCalled();
      }
      else {
        expect(massrel.helpers.req.xdr).not.toHaveBeenCalled();
        expect(massrel.helpers.req.jsonp).toHaveBeenCalled();
      }

      massrel.helpers.req.xdr = old_xdr;
      massrel.helpers.req.xdr = old_jsonp;
      massrel.helpers.req.supportsCors = old_cors;
      massrel.helpers.req.supportsJSON = old_json;
    };

    it('use CORS when supported', function() {
      testCors(true, true, true);
    });

    it('not use CORS when not supported', function() {
      testCors(false, false, true);
    });

    it('not use CORS when JSON parser not supported', function() {
      testCors(false, true, false);
    });

    it('make a request (browser must support CORS)', function() {
      if(massrel.helpers.req.supportsCors && massrel.helpers.req.supportsJSON) {
        var callback = jasmine.createSpy('success');

        massrel.helpers.req.xdr('http://tweetriver.com/bdainton/kindle.json', [], '_', this, callback);

        setTimeout(function() {
          expect(callback).not.toHaveBeenCalled();
        }, 1500);
      }

      waits(2000);

    });

  });

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

    it('should make a copy of an value of an array to prevent double encoding', function() {
      var vals = ['myuser/stream1', 'myuser/stream2'];
      var params = [['key1', vals]];
      var expected = 'key1=myuser%2Fstream1,myuser%2Fstream2';
      var qs;

      qs = to_qs(params);
      expect(qs).toEqual(expected);

      // build qs again to check for
      // double encoding issue
      qs = to_qs(params);
      expect(qs).toEqual(expected);
    })

  });

  describe('fix string dates to be parasable by JavaScript', function() {
    // using 2009 so we can test that it is not now
    var twitter_date = 'Tue Aug 02 22:05:13 +0000 2009';
    var twitter_to_date = 'Tue Aug 02 2009 22:05:13 +0000';

    // actually testing iso8601 format
    var fb_date = '2009-08-02T22:05:13+0000';
    var fb_to_date = '2009/08/02 22:05:13 +0000';

    it('should move the year from the end of a twitter JSON', function() {
      expect(massrel.helpers.fix_date(twitter_date)).toEqual(twitter_to_date);
    });

    it('should add spaces and stuff to facebook style dates', function() {
      expect(massrel.helpers.fix_date(fb_date)).toEqual(fb_to_date);
    });

    it('should be a real Date object', function() {
      var from_date = new Date(massrel.helpers.fix_date(twitter_date));
      var from_date_fb = new Date(massrel.helpers.fix_date(fb_date));
      var compare_to = new Date(twitter_to_date);

      // twitter
      expect(from_date.getFullYear()).toEqual(2009);
      expect(from_date.getTime()).toEqual(compare_to.getTime());

      // fb
      expect(from_date_fb.getFullYear()).toEqual(2009);
      expect(from_date_fb.getTime()).toEqual(compare_to.getTime());
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

  describe('extending and object', function() {
    it('copy over key/values', function() {
      var to_obj = {};
      to_obj['to'+(Math.random()*99999999)] = Math.random()*99999999;
      to_obj['to'+(Math.random()*99999999)] = Math.random()*99999999;

      var from_obj = {};
      from_obj.foo = 'bar';
      from_obj['from'+(Math.random()*99999999)] = Math.random()*99999999;
      from_obj['from'+(Math.random()*99999999)] = Math.random()*99999999;

      var out = massrel.helpers.extend(to_obj, from_obj);

      expect(out.foo).toEqual('bar');

      var key;
      for(key in from_obj) {
        expect(out[key]).toEqual(from_obj[key]);
      }
      for(key in to_obj) {
        expect(out[key]).toEqual(to_obj[key]);
      }
    });

    it('not overwrite preexisting keys', function() {
      var out = massrel.helpers.extend({ foo: 'bar1' }, { foo: 'bar2' });
      expect(out.foo).toEqual('bar1');
    });

    it('return original object instance', function() {
      var to_obj = {};
      var out = massrel.helpers.extend(to_obj, { foo: 'bar' });
      expect(to_obj).toBe(out);
    });

  });

  describe('steping through results', function() {
    it('fan out items through enumerators', function() {
      var randomItems = Math.ceil( Math.random() * 100 );
      var randomEnums = Math.ceil( Math.random() * 10 );
      var enumerators = [];

      // create enums
      for(var i = 0; i < randomEnums; i++) {
        enumerators.push( jasmine.createSpy('callback '+(i+1)) );
      }

      massrel.helpers.step_through(new Array(randomItems), enumerators, window);

      // check enums
      for(var i = 0; i < randomEnums; i++) {
        expect(enumerators[i].callCount).toEqual(randomItems);
      }
    });
  });

});
