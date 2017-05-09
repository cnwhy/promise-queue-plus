var path = require("path");
var gulp = require("gulp");
// var util = require("gulp-util");
var mocha = require("gulp-mocha");
var istanbul = require("gulp-istanbul");
var browserify = require("gulp-browserify");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var header = require("gulp-header");
var child_process = require('child_process')

var package = require("./package.json");
var banner =
  '/*!\n' +
  ' * ' + package.name + ' v' + package.version + '\n' +
  ' * Homepage ' + package.homepage + '\n' +
  ' * License ' + package.license + '\n' +
  ' */\n'

gulp.task('build', ['test'], function () {
  return gulp.src('./browser-source/*.js')
    .pipe(browserify())
    .pipe(header(banner))
    // .pipe(rename({
    // 	basename:package.name
    // }))
    .pipe(gulp.dest('./dist'))
    .pipe(uglify())
    .pipe(header(banner))
    .pipe(rename({
      //basename:package.name+".min"
      suffix: ".min"
    }))
    .pipe(gulp.dest('./dist'));
})


gulp.task('pre-test', function () {
  return gulp.src(['src/**/*.js'])
    // Covering files 
    .pipe(istanbul())
    // Force `require` to return covered files 
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src('test/mocha_*.js', {
      read: false
    })
    .pipe(mocha({
      reporter: 'dot'
    }))
    // Creating the reports after tests ran 
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 90% 
    .pipe(istanbul.enforceThresholds({
      thresholds: {
        global: 90
      }
    }));
});

gulp.task('publish', ['build'], function (cb) {
  child_process.exec("npm publish && git push", function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
})
// gulp.task('test',function(){
// 	return gulp.src('test/mocha_*.js', {read: false})
//         .pipe(mocha({reporter: 'nyan'}))
// });

gulp.task('default', ['build']);