module.exports = function (grunt) {
    'use strict';

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                './scripts/{,*/}*.js',
                'test/spec/{,*/}*.js'
            ]
        },
        jsdoc : {
            dist : {
                src: ['./scripts/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },
        connect: {
            test: {
                options: {
                    port: 8000,
                    base: '.'
                }
            }
        },
        browserify: {
            options : {
                transform: ['debowerify']
            },
            test: {
                src  : ['test/test.js'],
                dest : '.tmp/index.js',
                options : {
                    debug : true
                }
            }
        },
        bump: {
            options: {
                files              : ['package.json', 'bower.json'],
                updateConfigs      : [],
                commit             : false,
                commitMessage      : 'Release v%VERSION%',
                commitFiles        : ['package.json'],
                createTag          : false,
                tagName            : 'v%VERSION%',
                tagMessage         : 'Version %VERSION%',
                push               : false,
                pushTo             : 'upstream',
                gitDescribeOptions : '--tags --always --abbrev=1 --dirty=-d'
            }
        },
        open : {
            test : {
                path: 'http://localhost:8000/test',
                app: 'Google Chrome'
            }
        },
        watch: {
            scripts: {
                files: ['scripts/*.*', 'test/*.*'],
                tasks: ['browserify:test']
            }
        }
    });

    grunt.registerTask('test', [
        'browserify',
        'connect:test',
        'open:test',
        'watch'
    ]);

    grunt.registerTask('release', [
        'jshint',
        'bump'
    ]);
};
