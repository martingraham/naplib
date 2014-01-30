module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: '\n'
            },
            js: {
                // http://stackoverflow.com/questions/18453974/how-to-ignore-files-grunt-uglify
                src: ['naplib.js', '*.js', '!gruntfile.js'],
                dest: 'distrib/<%= pkg.name %>temp.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %>temp <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'distrib/<%= pkg.name %>temp.js',
                dest: 'distrib/<%= pkg.name %>.min.js'
            }
        },

        copy: {
            main: {
                expand: true,
                cwd: 'src/',
                src: ['iedataload.vbs'],
                dest: 'distrib/'
            }
        },

        clean: ['distrib/<%= pkg.name %>temp.js']
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'uglify', 'copy', 'clean']);
};