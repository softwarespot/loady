/* global require */

var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var del = require('del');
var fs = require('fs');
var merge = require('merge2');
var pkg = require('./package.json');

// Assets for the project
var Assets = {
    dest: './dist/',
    main: 'loady.js',
    minified: 'loady.min.js',
    minifiedES5: 'loady_es5.min.js',
    other: [
        './src/system.js',
        './src/user.js',
    ],
    source: './src/',
};

// See the uglify documentation for more details
var _uglifySettings = {
    compress: {
        comparisons: true,
        conditionals: true,
        /* jscs: disable */
        dead_code: true,
        drop_console: true,
        /* jscs: enable */
        unsafe: true,
        unused: true,
    },
};

// Clean the 'dist' directory
gulp.task('clean', function cleanTask(cb) {
    del([Assets.dest + '*.js'], cb);
});

// Run the babel transpiler to convert from ES2015 to ES5, as well as minifying
gulp.task('es2015to5', function es2015To5Task() {
    var babelSettings = {
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-umd'],
    };

    var streams = merge();

    streams.add(gulp.src(Assets.source + Assets.main)
        .pipe(babel(babelSettings))
        .pipe(uglify(_uglifySettings))
        .pipe(rename(Assets.minifiedES5))
        .pipe(gulp.dest(Assets.dest)));

    streams.add(gulp.src(Assets.other)
        .pipe(babel(babelSettings))
        .pipe(gulp.dest(Assets.dest)));

    return streams;
});

// Check the code meets the following standards outlined in .jshintrc
gulp.task('jshint', function jsHintTask() {
    return gulp.src(Assets.source + Assets.main)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// Uglify aka minify the main file
gulp.task('uglify', function uglifyTask() {
    // Copy the main file to the source directory
    return gulp.src(Assets.source + '/' + Assets.main)
        .pipe(gulp.dest(Assets.dest));

    // Uglify right now is unable to uglify ES2015
    // return gulp.src(Assets.source + '/' + Assets.main)
    //     .pipe(uglify(_uglifySettings))
    //     .pipe(rename(Assets.minified))
    //     .pipe(gulp.dest(Assets.dest));
});

// Watch for changes to the main file
gulp.task('watch', function watchTask() {
    gulp.watch(Assets.source + Assets.main, ['jshint', 'uglify']);
});

// Update version numbers based on the main file version comment
gulp.task('version', function versionTask() {
    // SemVer matching is done using (?:\d+\.){2}\d+

    var reConstantsVersion = /VERSION\s+=\s+'(?:\d+\.){2}\d+';/;
    var reMainVersion = /(?:(\n\s*\*\s+Version:\s+)(?:\d+\.){2}\d+)/;
    var reReadmeVersion = /^#\s+([\w\-]+)\s+-\s+v(?:\d+\.){2}\d+/;

    var version = pkg.version;

    var streams = merge();

    // Main file VERSION constant and number
    streams.add(
        gulp.src(Assets.source + Assets.main)
        .pipe(replace(reMainVersion, '$1' + version))
        .pipe(replace(reConstantsVersion, 'VERSION = \'' + version + '\';'))
        .pipe(gulp.dest(Assets.source))
    );

    // README.md version number
    streams.add(
        gulp.src(Assets.source + 'README.md')
        .pipe(replace(reReadmeVersion, '# $1 - v' + version))
        .pipe(gulp.dest(Assets.source))
    );

    return streams;
});

// Register the default task
gulp.task('default', ['version', 'jshint', 'uglify', 'es2015to5']);

// 'gulp es2015to5' to transpile from ES2015 to ES5, as well as minifying
// 'gulp jshint' to check the syntax
// 'gulp uglify' to uglify the main file
// 'gulp watch' to watch for changes to the main file
// 'gulp version' to update the version numbers based on the main file version comment
