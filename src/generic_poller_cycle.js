define(['./helpers'], function(helpers) {

  function GenericPollerCycle(skip, callback, errback) {
    this.cg = helpers.callback_group();
    this.skip = this.cg(skip);
    this.callback = this.cg(callback);
    this.errback = this.cg(errback);
    this._enabled = true;
  }

  GenericPollerCycle.prototype.enabled = function() {
    return this._enabled;
  };

  GenericPollerCycle.prototype.disable = function() {
    this.cg.deactivate();
    this._enabled = false;
  };

  return GenericPollerCycle;

});
