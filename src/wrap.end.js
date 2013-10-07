// call massrel module
var globals = massreljs.require('massrel');

var massrel = window.massrel;
if(typeof(massrel) === 'undefined') {
  massrel = window.massrel = globals;
} else {
  globals.helpers.extend(massrel, globals);
}

// If there's an external AMD loader defined, define this library in that context.
if (typeof define === 'function' && define.amd) {
  define(massrel);
}

})(window);
