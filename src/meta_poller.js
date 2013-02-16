define(['helpers', 'generic_poller'], function(helpers, GenericPoller) {

  function MetaPoller() {
    GenericPoller.apply(this, arguments);
  }

  helpers.extend(MetaPoller.prototype, GenericPoller.prototype);

  MetaPoller.prototype.fetch = function(object, options, skip, callback, errback) {
    object.meta(options, callback, errback);
    return this;
  };

  // alias
  MetaPoller.prototype.each = MetaPoller.prototype.data;

  return MetaPoller;
});
