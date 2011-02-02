= Read Me =

== Basic examples ==

    var stream = new tweetriver.Stream('bdainton', 'kindle');
    stream.poller({
      limit: 10, // 
      frequency: 30 // how often to get new tweets
    }).batch(function(tweets) {
        reorder = [];
        while(tweets.length > 0) {
          reorder.push(tweets.pop());
        }
        twttr.brdcast.showStatuses(reorder);
    }).start();

== Advanced examples ==

    var stream = new tweetriver.Stream('bdainton', 'kindle');

    //gets a NEW poller for the stream
    var poller = stream.poller();

    poller.each(function(tweet) {
      // invoke for every tweet that is return from the api
      // from oldest to newest
      console.log(tweet);
  
      // "this" is the poller instance
    })

    poller.batch(function(tweets) {
      // all tweets from each poll that have > 0 tweets
      console.log(tweets);
  
      // "this" is the poller instance
    })

    // start grabbing tweets
    poller.start();

    setTimeout(function() {
      // in 1 minute, stop getting tweets
      poller.stop();
    }, 60000);


    // the best part is that it is chainable
    stream.poller({ frequency: 30 }).each(function(tweet) {
      var container = document.getElementById('tweet-quick');
  
      var ptag = document.createElement('p');
      ptag.innerHTML = tweet.text;
      container.insertBefore(ptag, container.firstChild);
    }).start();




    // here is an example of delayed queue
    var poller = stream.poller();
    var queue = new tweetriver.PollerQueue(poller);

    poller.start();

    queue.next(function(tweet, step) {
      var container = document.getElementById('tweet-delay');
  
      var ptag = document.createElement('p');
      ptag.innerHTML = tweet.text;
      container.insertBefore(ptag, container.firstChild);
      setTimeout(step, 1000);
    });