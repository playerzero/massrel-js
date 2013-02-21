// call massrel module
var massrel = massreljs.require('massrel');

// If there's an external AMD loader defined, define this library in that context.
if (typeof define === 'function' && define.amd) {
  define(massrel);
}

})(window);
