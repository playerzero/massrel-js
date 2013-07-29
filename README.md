# Read Me

## Basic examples

    // get data for stream "bdainton/kindle"
    var stream = new massrel.Stream('bdainton', 'kindle');

    stream.poller({
      limit: 10,    // number of tweets per poll
      frequency: 30 // how often to get new tweets
    }).batch(function(tweets) {
        // resort so tweets on top are the newest
        reorder = [];
        while(tweets.length > 0) {
          reorder.push(tweets.pop());
        }

        // print array of new tweets
        console.log(reorder);
    }).start();

## Advanced examples

### Create stream

    var stream = new massrel.Stream('bdainton', 'kindle');

### Create pollers

    //gets a NEW poller for the stream
    var poller = stream.poller();

For each poller instance usually a callback is either added to .each or .batch but not both

#### Poller enumerator

Callback invoked for each tweet as they come in from oldest tweet to newest

    poller.each(function(tweet) {
      // invoke for every tweet that is return from the api
      // from oldest to newest
      console.log(tweet);

      // "this" is the poller instance
    })

#### Poller batch

Callback invoked for each poll that has more than zero tweets

    poller.batch(function(tweets) {
      // all tweets from each poll that have > 0 tweets
      console.log(tweets);

      // "this" is the poller instance
    })

#### Start poller

    // start grabbing tweets
    poller.start();

#### Stop poller

    setTimeout(function() {
      // in 1 minute, stop getting tweets
      poller.stop();
    }, 60000);


#### Poller example

    // the best part is that it is chainable
    stream.poller({ frequency: 30 }).each(function(tweet) {
      var container = document.getElementById('tweet-quick');

      var ptag = document.createElement('p');
      ptag.innerHTML = tweet.text;
      container.insertBefore(ptag, container.firstChild);
    }).start();

### Delayed queue example

Basically if you want to display tweets on a regular interval

    // here is an example of delayed queue
    var poller = stream.poller();
    var queue = new massrel.PollerQueue(poller);

    poller.start();

    queue.next(function(tweet, step) {
      var container = document.getElementById('tweet-delay');

      var ptag = document.createElement('p');
      ptag.innerHTML = tweet.text;
      container.insertBefore(ptag, container.firstChild);
      setTimeout(step, 1000);
    });

Shorthand

    var poller = stream.poller().queue(function(tweet, step) {
      var container = document.getElementById('tweet-delay');

      var ptag = document.createElement('p');
      ptag.innerHTML = tweet.text;
      container.insertBefore(ptag, container.firstChild);
      setTimeout(step, 1000);
    }).start();

# Change log

## v0.16.0

* Add TopThingsPoller

## v0.15.1

* Add missing meta poller params

## v0.15.0

* Add GetGlue support to Context

## v0.14.2

* Add helpers.always
* Add Context.getPhotoUrl

## v0.13.11

* Add RSS to Context

## v0.13.10

* Fix bug in 0.13.10

## v0.13.9

* Fix original\_referer in tweet intent

## v0.13.8

* Improve Facebook network detection

## v0.13.7

* Fix the way intents#user parses `screen_name_or_id` when it contains a number

## v0.13.6

* Fix broken Poller#more and add tests (c4550cbf6a)
* Minor changes to the request counter

## v0.13.5

* Add missing param to Poller#queue (955cebec5b)

## v0.13.4

* Switch to anonymous define for external AMD loaders (55d7840e96)

## v0.13.3

* Warn if too many requests made in a minute (1050d4f16b)

## v0.13.2

* Allow override of default stream poller options for initial poll (13eca5e698)

## v0.13.1

* Refactored CORS req so IE10 will use XHR2 object
* Bug fix for backoff shortening delay if greater than backoff max

## v0.13.0

* Implement `GenericPoller` that all other pollers inherit from. Handles
  polling delay backoff when errors happen (b99c01e4fa)
* Add hail mary mode to `Poller` which will make stream requests
  without `since_id` and do request diffs client side (b99c01e4fa)
* Override default host when massrel[host] URL param is used
  (087fe37eab)
* Refactor `helpers.parse_params` (bcbf443e9a)

## v0.12.0

* Moved back to single built file, rather than internal/external builds.
* Almond.js updated to latest stable version.

## v0.11.1

* Cast all `fix_date` inputs to strings to resolve IE issues (ec390e725d)

## v0.11.0

* CORS support. Cross domain requests to API when browser supports it instead of JSONP. (259ed3563a)

## v0.10.0

* Filter stream to a single network (3f945b85c5)
* Allow port and host overrides on the massrel module (0be2bbedbf)

## v0.9.11

* Correct typo with `Compare` support (44a744b073)
* `networks` is a new param on `Stream#meta` (623b28993e, db1155493e)
* Improve date support for IE 7 - 8 in `fix_date` (1b6fc24b5d)

## v0.9.10

* Automatically add `original_referer` param when using intents URL helper (5fd729243b)
* `Context` class supports Google+ and Instagram types (6158535fb3)
* `num_trends` is a new param on `Stream#meta` (cefde81cae)
* `Compare` API support (use `new massrel.Compare`)
* `top_count` is a new param on `Stream#meta` (4aabe2e7c7)

## v0.9.9

* `top_period_relative` is a new param on `Stream#meta` (b0e3013f24)
* bind current poller instance to `this` in `Poller#more` callback (45e8c496a3)
* fixed bug so that the massrel.js lib doesn't replace any existing global massrel global object (71ac8a739e)
* fixed bug that prevented newer statuses from being pulled in correctly if `Poller#more` was called before `Poller#start` (19c96fc767)
* `stay_realtime` is a new param for `Poller` (default: true) (replaces old `catch_up` param) (cb9c796692...f860ea3ba0, and bug fix c85cd339d3)

## v0.9.8

* `num_hours` is a new param on `Stream#meta`
* `keywords` now works when polling streamer

## v0.9.7

* catch race condition that prevents `MetaPoller` from being stopped when called to stop (fixes #1)
* `num_days` is a new param on `Stream#meta`
* `num_minutes` is a new param on `Stream#meta`
* intent url generator (e.g. `massrel.intents.tweet({ text: 'Awesome!!', hashtags: ['awesome', 'nice'] });`)

## v0.9.6

* enable intents by default in `Context`
* `top_periods` is a new param on `Stream#meta`
* `finish` is a new param on `Stream#meta`
* added a way for you to update `MetaPoller` options on the fly

## v0.9.5

* add `keywords` param for streams
* meta poller for Account (use `Account#metaPoller`)
* global minimum poll value. for use in a possible QoS implementation

## v0.9.4

* fix mispelled method names in `Account` and `Stream` which caused `#meta` to break when called (`builMetaParams` changed to `buildMetaParams`)

## v0.9.3

* added `Poller#more` method to pull older statuses from a timeline. It keeps track of the last item in the list for subsequent requests
* created query param builder methods for stream and account requests (use `Stream#buildParams`, `Stream.buildMetaParams`, or `Account#buildMetaParams`)

## v0.9.2

* added conveniece wrapper for polling stream meta info (use `Stream#metaPoller`)
* define API as AMD if public AMD `define` method exists

## v0.9.1

* first versioned package
* overhall system to use jburke/r.js & almond for build system

