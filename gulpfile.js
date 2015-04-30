var gulp = require('gulp');
var gutil = require('gulp-util');
var parseArgs = require('minimist')

var baseSrcDir = './src/';
var baseDestDir = './build/';
var compileDestDir = './compiled/';
var port = 9000;

var defaultOptions = {
	supportIE8: false // Pass --supportIE8=true to change
};

var options = parseArgs(process.argv.slice(2), defaultOptions);

gulp.task('compile', ['build-production']);
gulp.task('develop', ['watch', 'connect']);

gulp.task('build-development', ['common', 'build-html', 'build-styles', 'build-scripts', 'build-fonts', 'build-images']);
gulp.task('build-production', ['common', 'compile-html', 'compile-styles', 'compile-scripts', 'compile-fonts', 'compile-images']);

gulp.task('common', ['jshint']);


/*
 * Watch - Watch files, trigger tasks when they are modified
 */

gulp.task('watch', ['build-development'], function () {
	gulp.watch('src/scss/**', ['build-styles']);
	gulp.watch('src/images/**', ['build-images']);
	gulp.watch('src/templates/**', ['build-html']);
	gulp.watch('src/javascript/**', ['jshint', 'build-scripts']);
});


/*
 * Connect - Serve files, on a silver platter
 */

var connect = require('gulp-connect');

gulp.task('connect', function () {
	connect.server({
		root: [baseDestDir],
		port: port
	})
});


/*
 * Scripts - Use Browserify to compile and move JavaScript
 */

// @todo: Make these tasks more composable

var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var size = require('gulp-size');
var es6ify = require('es6ify');

gulp.task('build-scripts', function () {
	var bundler = browserify();
	if (!options.supportIE8) {
		bundler
			.add(es6ify.runtime)
			.transform(es6ify.configure(new RegExp(/^(?!.*node_modules)+.+\.js$/)))
	}
	return bundler
		.add(baseSrcDir + 'javascript/app.js')
		.bundle()
		.pipe(source('app.js'))
		.pipe(gulp.dest(baseDestDir + '/js'));
});

gulp.task('compile-scripts', function () {
	var bundler = browserify();
	if (!options.supportIE8) {
		bundler
			.add(es6ify.runtime)
			.transform(es6ify.configure(new RegExp(/^(?!.*node_modules)+.+\.js$/)))
	}
	return bundler
		.add(baseSrcDir + 'javascript/app.js')
		.bundle()
		.pipe(source('app.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(size())
		.pipe(gulp.dest(compileDestDir + '/js'));
});


/*
 * jshint - Ensure our JavaScript is pretty lookin
 */

var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('jshint', function () {
	gulp.src(baseSrcDir + 'javascript/app.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});


/*
 * Images - Compress and move images
 **/

var changed = require('gulp-changed');
var imagemin = require('gulp-imagemin');

var imagify = function(dest) {
	return function () {
		return gulp.src(baseSrcDir + 'images/**')
		.pipe(changed(baseSrcDir + 'images/**')) // Ignore unchanged files
		.pipe(imagemin()) // Optimize
		.pipe(gulp.dest(dest + 'images/'));
	}
};

gulp.task('build-images', imagify(baseDestDir));
gulp.task('compile-images', imagify(compileDestDir));


/*
 * Compile / Move Jade (HTML)
 * */

var jade = require('gulp-jade');
var htmlify = function(dest) {
	return function () {
		return gulp.src(baseSrcDir + 'templates/layouts/*.jade')
			.pipe(jade({
				pretty: true
			})).on('error', gutil.log)
			.pipe(gulp.dest(dest));
	}
};

gulp.task('build-html', htmlify(baseDestDir));
gulp.task('compile-html', htmlify(compileDestDir));


/*
 * Fonts - Move font files
 * */

var fontify = function(dest) {
	return function () {
		return gulp.src(baseSrcDir + 'fonts/*')
			.pipe(gulp.dest(dest));
	}
};

gulp.task('build-fonts', fontify(baseDestDir));
gulp.task('compile-fonts', fontify(compileDestDir));


/*
 * SASS - Compile and move sass
 **/

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var pixrem = require('gulp-pixrem');
var minifyCSS = require('gulp-minify-css');

gulp.task('build-styles', function () {
	var sources = [baseSrcDir + 'scss/app.scss'];
	if (options.supportIE8) {
		sources.push(baseSrcDir + 'scss/ie8.scss');
	}

	return gulp.src(sources)
		.pipe(sass({
			outputStyle: 'expanded',
			errLogToConsole: true
		})).on('error', gutil.log)
		.pipe(sourcemaps.init())
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(pixrem())
		.pipe(sourcemaps.write('./maps'))
		.pipe(gulp.dest(baseDestDir + 'css/'));
});

gulp.task('compile-styles', function () {
	var sources = [baseSrcDir + 'scss/app.scss'];
	if (options.supportIE8) {
		sources.push(baseSrcDir + 'scss/ie8.scss');
	}

	return gulp.src(sources)
		.pipe(sass({
			outputStyle: 'expanded',
			errLogToConsole: true
		})).on('error', gutil.log)
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(pixrem())
		.pipe(minifyCSS())
		.pipe(gulp.dest(compileDestDir + 'css/'));
});
