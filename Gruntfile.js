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
	grunt.registerTask('default', ['concurrent']);
};