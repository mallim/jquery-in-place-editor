/*
 jQuery-in-place-editor
 http://github.com/mallim/jquery-in-place-editor

 Copyright (c) 2013 Dave Hauenstein, Martin Häcker, Ian Lim and contributors
 Licensed under the MIT license.
 */

"use strict";

module.exports = function( grunt ){

  grunt.initConfig( {
    mocha_phantomjs:{
      test:{
        /**
        options: {
          'reporter': 'dot'
        },
        **/
        files: {
          src: ['mocha/index.html']
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 9090,
          base: '.'
        }
      }
    }
  });

  grunt.loadNpmTasks( 'grunt-mocha-phantomjs' );
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('test', ['connect', 'mocha_phantomjs']);
};

