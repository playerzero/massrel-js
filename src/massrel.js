define('massrel', [
         'globals'
       , 'helpers'
       , 'stream'
       , 'account'
       , 'poller'
       , 'poller_queue'
       , 'context'
       ], function(
         globals
       , helpers
       , Stream
       , Account
       , Poller
       , PollerQueue
       , Context
       ) {

  var massrel = window.massrel;
  if(typeof(massrel) === 'undefined') {
    var massrel = window.massrel = globals;
  }

  // public API
  massrel.Stream = Stream;
  massrel.Account = Account;
  massrel.Poller = Poller;
  massrel.PollerQueue = PollerQueue;
  massrel.Context = Context;
  massrel.helpers = helpers;

  // require/AMD methods
  massrel.define = define;
  massrel.require = require;
  massrel.requirejs = requirejs;

});
