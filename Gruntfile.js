module.exports = function(grunt) {

  var banner = [
    '  /*!',
    '   * <%= pkg.name %> <%= pkg.version %>',
    '   *',
    '   * Copyright <%= (new Date()).getFullYear() %> Mass Relevance',
    '   *',
    '   * Licensed under the Apache License, Version 2.0 (the "License");',
    '   * you may not use this work except in compliance with the License.',
    '   * You may obtain a copy of the License at:',
    '   *',
    '   *    http://www.apache.org/licenses/LICENSE-2.0',
    '   */\n'
  ].join('\n');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      compile: {
        options: {
          baseUrl: './src',
          name: 'almond',
          include: 'massrel',
          namespace: 'massreljs',
          skipModuleInsertion: true,
          optimize: 'none',
          out: 'build/massrel.js'
        },
      }
    },
    concat: {
      build: {
        src: [
          'src/wrap.start.js',
          'build/massrel.js',
          'src/wrap.end.js'
        ],
        dest: 'build/massrel.js'
      },
      release: {
        options: {
          stripBanners: true,
          banner: banner
        },
        files: {
          'massrel.js': ['build/massrel.js'],
          'massrel.min.js': ['build/massrel.min.js'],
          'pkg/massrel.<%= pkg.version %>.js': ['build/massrel.js'],
          'pkg/massrel.min.<%= pkg.version %>.js': ['build/massrel.min.js']
        }
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      build: {
        src: 'build/massrel.js',
        dest: 'build/massrel.min.js'
      }
    },
    jasmine: {
      test: {
        src: [
          'build/massrel.js'
        ],
        options: {
          specs: 'test/spec/*.spec.js',
          keepRunner : false,
          vendor: [
          ]
        }
      },
      coverage: {
        src: [
          'build/massrel.js'
        ],
        options: {
          specs: 'test/spec/*.spec.js',
          keepRunner : false,
          vendor: [
          ],
          template: require('grunt-template-jasmine-istanbul'),
          templateOptions: {
            coverage: 'build/coverage/coverage.json',
            report: [{
              type: 'html',
              options: {
                dir: 'build/coverage'
              }
            }, {
              type: 'text-summary'
            }]
          }
        }
      }
    }
  });

  grunt.registerTask('default', ['build']);
  grunt.registerTask('build:only', ['requirejs', 'concat:build', 'uglify']);
  grunt.registerTask('test', ['jasmine:test']);
  grunt.registerTask('build', ['build:only', 'test']);
  grunt.registerTask('release', ['build', 'concat:release']);
  grunt.registerTask('travis', ['build']);

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

};
