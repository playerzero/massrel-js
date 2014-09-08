define(function(require) {
  var helpers = require('./helpers');

  var Search = function(apiToken) {
    this.apiToken = apiToken;
  };

  Search.prototype.url = function() {
    return helpers.api_url('/search/search.json');
  };

  Search.prototype.fetch = function(params, fn, error) {
    params = this.buildQueryString(params);
    helpers.request_factory(this.url(), params, '_', this, fn, error);
    return this;
  };

  Search.prototype.buildQueryString = function(params) {
    var p = [];
    if(typeof(params.q) === 'string') {
      p.push(['q', params.q]);
    }
    if(params.filters) {
      p = p.concat(this.buildParams(params.filters, 'filter.'));
    }
    if(params.views) {
      var viewName;
      var view;
      for(viewName in params.views) {
        view = params.views[viewName];
        if(typeof(view) === 'boolean') {
          p.push(['view.'+viewName, view ? '1' : '0']);
        }
        else {
          p = p.concat(this.buildParams(view, 'view.'+viewName+'.'));
        }
      }
    }

    return p;
  };

  Search.prototype.buildParams = function(object, prefix) {
    prefix = prefix || '';
    var k;
    var value;
    var i;
    var params = [];
    for(k in object) {
      value = object[k];
      if(!helpers.is_array(value)) {
        value = [value];
      }

      for(i = 0, len = value.length; i < len; i++) {
        var innerValue = value[i];
        if(typeof(innerValue) === 'boolean') {
          innerValue = innerValue ? '1' : '0';
        }
        params.push([prefix+k, innerValue]);
      }
    }

    return params;
  };




  return Search;


});
