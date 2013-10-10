define([
         './globals'
       , './helpers'
       , './stream'
       , './account'
       , './stream_keyword_insights'
       , './stream_activity'
       , './generic_poller'
       , './generic_poller_cycle'
       , './poller'
       , './meta_poller'
       , './top_things_poller'
       , './poller_queue'
       , './context'
       , './compare'
       , './compare_poller'
       , './intents'
       ], function(
         massrel
       , helpers
       , Stream
       , Account
       , StreamKeywordInsights
       , StreamActivity
       , GenericPoller
       , GenericPollerCycle
       , Poller
       , MetaPoller
       , TopThingsPoller
       , PollerQueue
       , Context
       , Compare
       , ComparePoller
       , intents
       ) {

  // public API
  massrel.Stream = Stream;
  massrel.Account = Account;
  massrel.StreamKeywordInsights = StreamKeywordInsights;
  massrel.StreamActivity = StreamActivity;
  massrel.GenericPoller = GenericPoller;
  massrel.GenericPollerCycle = GenericPollerCycle;
  massrel.Poller = Poller;
  massrel.MetaPoller = MetaPoller;
  massrel.TopThingsPoller = TopThingsPoller;
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
