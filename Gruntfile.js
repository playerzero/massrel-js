module.exports = function(grunt) {
  grunt.initConfig({
    jasmine: {
      components: {
        src: [
          'massrel.js',
          'misc/*.js'
        ],
        options: {
          specs: 'test/spec/*.spec.js',
          keepRunner : false,
          vendor: [
            'lib/jquery.js'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jasmine');
};
