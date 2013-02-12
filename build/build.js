/*
 * Build file for massrel-js
 */

({
  /*
   * Base url for source files (relative to this build file).
   */
  baseUrl: "../src",

  name: "almond",

  include: "massrel",

  namespace: 'massreljs',

  skipModuleInsertion: true,

  wrap: {
    startFile: "../src/wrap.start.js",
    endFile: "../src/wrap.end.js"
  }
})
