module.exports = function(grunt) {

  grunt.initConfig({
    jasmine: {
      components: {
        src: [
          'massrel.js'
        ],
        options: {
          specs: 'test/spec/*.spec.js',
          keepRunner : true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
