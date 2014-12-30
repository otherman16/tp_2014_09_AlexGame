module.exports = function (grunt) {
	grunt.initConfig({
		shell: {
			options: {
				stdout: true,
				stderr: true
			},
			server: {
				command: 'java -cp AlexsGame.jar main.Main 8080'
			}
		},
		fest: {
			templates: {
				files: [{
					expand: true,
					cwd: 'templates',
					src: '*.xml',
					dest: 'public_html/js/tmpl'
				}],
				options: {
					template: function (data) {
						return grunt.template.process(
							'define(function () { return <%= contents %> ; });',
							{data: data}
							);
					}
				}
			}
		},
		watch: {
			fest: {
				files: ['templates/*.xml'],
				tasks: ['fest'],
				options: {
					interrupt: true,
					atBegin: true
				}
			},
			server: {
				files: [
				'public_html/js/**/*.js',
				'public_html/css/**/*.css'
				],
				options: {
					livereload: true
				}
			},
            sass: {
                files: ['public_html/css/*.scss'],
                tasks: ['sass'],
                options: {
                    atBegin: true
                }
            }
		},

        sass: {
            css: { /* Подзадача */
                files: [
                    {
                        expand: true,
                        cwd: 'public_html/css', /* исходная директория */
                        src: '*.scss', /* имена шаблонов */
                        dest: 'public_html/css', /* результирующая директория */
                        ext: '.css'
                    }
                ]
            }
        },

        requirejs: {
            build: {
                options: {
                    almond: true,
                    baseUrl: "public_html/js",
                    mainConfigFile: "public_html/js/epicgame.js",
                    name: "epicgame",
                    optimize: "none",
                    out: "public_html/js/build/epicgame.js"
                }
            }
        },

        uglify: {
            build: {
                files: {
                    'public_html/js/build.min.js':
                        ['public_html/js/build.js']
                }
            }
        },
        concat: {
            build: { /* Подзадача */
                options: {
                    separator: ';\n'
                },
                src: ['public_html/js/lib/almond.js', 'public_html/js/lib/require.ls', 'public_html/js/build/epicgame.js', ],
                dest: 'public_html/js/build.js'
            }
        },

		concurrent: {
			target: ['watch', 'shell'],
			options: {
				logConcurrentOutput: true
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-fest');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.registerTask('default', ['concurrent']);
    grunt.registerTask(
        'build',
        [
            'fest', 'requirejs:build',
            'concat:build', 'uglify:build'
        ]
    );



};
