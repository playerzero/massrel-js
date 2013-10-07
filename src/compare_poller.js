define(['./helpers', './generic_poller'], function(helpers, GenericPoller) {

  function ComparePoller() {
    GenericPoller.apply(this, arguments);
  }

  helpers.extend(ComparePoller.prototype, GenericPoller.prototype);

  ComparePoller.prototype.fetch = function(object, options, cycle) {
    object.load(options, cycle.callback, cycle.errback);
    return this;
  };

  // alias
  ComparePoller.prototype.each = ComparePoller.prototype.data;

  return ComparePoller;
});
