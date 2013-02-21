define('massrel', [
         'globals'
       , 'helpers'
       , 'stream'
       , 'account'
       , 'generic_poller'
       , 'generic_poller_cycle'
       , 'poller'
       , 'meta_poller'
       , 'poller_queue'
       , 'context'
       , 'compare'
       , 'compare_poller'
       , 'intents'
       ], function(
         globals
       , helpers
       , Stream
       , Account
       , GenericPoller
       , GenericPollerCycle
       , Poller
       , MetaPoller
       , PollerQueue
       , Context
       , Compare
       , ComparePoller
       , intents
       ) {

  var massrel = window.massrel;
  if(typeof(massrel) === 'undefined') {
    massrel = window.massrel = globals;
  } else {
    helpers.extend(massrel, globals);
  }

  // public API
  massrel.Stream = Stream;
  massrel.Account = Account;
  massrel.GenericPoller = GenericPoller;
  massrel.GenericPollerCycle = GenericPollerCycle;
  massrel.Poller = Poller;
  massrel.MetaPoller = MetaPoller;
  massrel.PollerQueue = PollerQueue;
  massrel.Context = Context;
  massrel.Compare = Compare;
  massrel.ComparePoller = ComparePoller;
  massrel.helpers = helpers;
  massrel.intents = intents;

  // change default host if "massrel[host]"
  // URL param is set
  var params = helpers.parse_params();
  if(params['massrel[host]']) {
    massrel.host = params['massrel[host]'];
  }

  return massrel;
});
