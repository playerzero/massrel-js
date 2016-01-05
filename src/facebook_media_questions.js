define(['./helpers', './poller'], function(helpers, Poller) {

  function FacebookMediaQuestionPoller() {

  }

  FacebookMediaQuestionPoller.prototype.url = function() {
    return helpers.api_url('/facebook/media_question.json');
  };

  FacebookMediaQuestionPoller.prototype.buildParams = function(opts) {
    opts = opts || {};
    var params = [];
    if (opts.id) {
      params.push(['id', opts.id]);
    }
    if (opts.page) {
      params.push(['page', opts.page]);
    }

    return params;
  };

  FacebookMediaQuestionPoller.prototype.load = function(opts, fn, error) {
    opts = helpers.extend(opts || {}, {
      // put defaults
    });

    var params = this.buildParams(opts);
    helpers.request_factory(this.url(), params, '_', this, fn || this._enumerators, error);

    return this;
  };

  FacebookMediaQuestionPoller.prototype.poller = function(opts) {
    return new Poller(this, opts);
  };

  return FacebookMediaQuestionPoller;
});