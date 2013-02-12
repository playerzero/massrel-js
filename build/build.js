/*
 * Build file for massrel-js
 */

({
  /*
   * Base url for source files (relative to this build file).
   */
  baseUrl: "../src",

  name: "almond",

  include: ["massrel"],

  insertRequire: ["massrel"],

  skipModuleInsertion: true,

  wrap: true
})
