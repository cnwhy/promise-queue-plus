module.exports = function(grunt){
	grunt.initConfig({
		'pkg': grunt.file.readJSON('package.json'),
		mochaTest: {
			test: {
				src:['test/mocha_*.js'],
				options: {
					quiet:false
				}

			}
		},
		browserify: {
			dist: {
				src: 'queue-fun-mode.js',
				dest: 'temp/<%= pkg.name %>.js'
			}
		},
		uglify: {
			dist: {
				src: '<%= browserify.dist.dest%>',
				dest: '<%= pkg.name %>.min.js'
			}
		},
		clean: ['temp/']
	})
	//queue-fun.min.js
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.registerTask('default', ['mochaTest','browserify','uglify','clean']);
};