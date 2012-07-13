define(['helpers', 'generic_poller'], function(helpers, GenericPoller) {

  function MetaPoller() {
    GenericPoller.apply(this, arguments);
  }

  helpers.extend(MetaPoller.prototype, GenericPoller.prototype);

  MetaPoller.prototype.fetch = function(object, options, skip, callback, error) {
    object.meta(options, callback, error);
    return this;
  };

  MetaPoller.prototype.each = MetaPoller.prototype.data;

  return MetaPoller;
});

