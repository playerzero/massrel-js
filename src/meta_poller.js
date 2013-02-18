define(['helpers', 'generic_poller'], function(helpers, GenericPoller) {

  function MetaPoller() {
    GenericPoller.apply(this, arguments);
  }

  helpers.extend(MetaPoller.prototype, GenericPoller.prototype);

  MetaPoller.prototype.fetch = function(object, options, cycle) {
    object.meta(options, cycle.callback, cycle.errback);
    return this;
  };

  // alias
  MetaPoller.prototype.each = MetaPoller.prototype.data;

  return MetaPoller;
});
