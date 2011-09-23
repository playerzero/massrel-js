// requires jQuery
(function() {

function UIList(selector, opts) {
  this.elList = $(selector);
  this.existing = [];

  opts = massrel.helpers.extend(opts || {}, {
    limit: 10,
    renderer: UIList.defaultRenderer,
    beforeInsert: UIList.noop,
    afterInsert: UIList.noop,
    beforeRemove: UIList.noop,
    afterRemove: UIList.noop
  });
  
  massrel.helpers.extend(this, opts);
}

UIList.prototype.insert_ = function(where, item) {
  var html = this.renderer(item) || '';
  var elem = $(document.createElement('div')).html(html).unwrap();
  
  while(this.existing.length >= this.limit) {
    this.remove(this.existing.shift());
  }

  this.beforeInsert(elem);
  this.elList[where](elem);
  this.afterInsert(elem);

  this.existing.push(elem);

  return this;
};

UIList.prototype.append = function(item) {
  return this.insert_('append', item);
};

UIList.prototype.prepend = function(item) {
  return this.insert_('prepend', item);
};

UIList.prototype.remove = function(elem) {
  this.beforeRemove(elem);
  elem.remove();
  this.afterRemove(elem);
};

UIList.prototype.itemRenderer = function(renderer) {
  if(typeof(renderer) === 'function') {
    this.renderer = renderer;
  }
  return this;
};

UIList.defaultRenderer = function(item) {
  return item.toString();
};
UIList.noop = function() {};


if(typeof(window.massrel) === 'undefined') {
  window.massrel = {};
}
massrel.UIList = UIList;

})();
