module.exports = function(grunt){
	grunt.initConfig({
		'pkg': grunt.file.readJSON('package.json'),
		banner: '/**\n' +
            ' * <%= pkg.name %> v<%= pkg.version %>\n' +
            ' * <%= pkg.homepage %>\n' +
            ' */\n',
		watch: {//监控文件
			files: ['/lib/*.js'],  
			tasks: ['jshint', 'qunit']  
		},
		concat: {//合并文件
			options: {
				banner:'/*=========*/',
				separator: ';'
			},
			dist: {
				src: ['lib/Q.js'],
				dest: 'temp/Q.js'
			}
		},
		jshint: { //检查JS语法
			files: ['lib/*.js'], 
			options: {  
				laxcomma:true,
				"asi": true,
				"boss": true,
				strict: true,
				globals: {  
					node: true
				}
				
			}  
		},
		mochaTest: { //单元测试
			test: {
				src:['test/mocha_*.js'],
				options: {
					quiet:false
				}

			}
		},
		browserify: { //生成浏览器版本
			dist: {
				src: 'queue-fun-mode.js',
				dest: '_temp/<%= pkg.name %>.js'
			}
		},
		uglify: {  //压缩浏览器版
			options: {
				banner: '<%= banner %>',
				report: "gzip"
			},
			dist: {
				src: '<%= browserify.dist.dest%>',
				dest: '<%= pkg.name %>.min.js'
			}
		},
		clean: ['_temp/'], //删除临时文件
		diy:{
			dist: {
				src: 'code/Q.js',
				dest: 'lib/Q_.js',
				ClassName: 'Q'
			}
		},
	})

	//queue-fun.min.js
	grunt.loadNpmTasks('grunt-browserify');     //将nodejs模块 运行在浏览器端
	grunt.loadNpmTasks('grunt-contrib-uglify'); //uglify压缩js
	grunt.loadNpmTasks('grunt-contrib-clean');  //删除文件
	grunt.loadNpmTasks('grunt-mocha-test');     //mocha grunt 插件
	//grunt.loadNpmTasks('grunt-contrib-watch');  //文件监控
	grunt.loadNpmTasks('grunt-contrib-jshint'); //代码检查
	//grunt.loadNpmTasks('grunt-contrib-concat'); //合并文件

	grunt.registerTask('default', ['mochaTest','browserify','uglify','clean']);
	grunt.registerTask('test', ['mochaTest']);
	grunt.registerTask('js', ['jshint']);

	// grunt.registerTask('diy', 'diy OK',function(){
	// 	grunt.log.writeln(this.name)
	// 	grunt.log.writeln(Array.prototype.join.call(arguments,","))
	// });
	// grunt.registerMultiTask('diy','diy OK',function(){
	// 	grunt.log.writeln("name" + ":" + this.name)
	// 	grunt.log.writeln("target" + ":" + this.target)
	// 	grunt.log.writeln("data" + ":" + this.data)
	// 	var code = grunt.file.read(this.data.src)
	// 	var tdata = {ClassName:this.data.ClassName,corders:code}
	// 	var newCode = grunt.template.process(t,{data:tdata})
	// 	// grunt.log.writeln(code);
	// 	// grunt.log.writeln(newCode);
	// 	grunt.file.write(this.data.dest,newCode)

	// })

};