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

# TO DO

* tests
* conversations/reply-to in status UI
* better abstraction to update relative time in status periodically
* include optional param to show author location in status UI
* break out *jsonp_factory* to be a replaceable io transport, so we can use XHR or CORS easily in future
* use HTTPS urls when on a secure page
* change anchor text to use entitites given in in JSON (/entities/urls)
* better date handling (is8601 and twitter formmated date conversion not very thorough)
* build out Account API (e.g. Account#streams instead of just Account#meta)
* abstract Poller class to handle of data besides streams api (meta anyone?)
