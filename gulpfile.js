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

// Assets for the project
var Assets = {
    dest: 'dist',
    main: 'loady.js',
    minified: 'loady.min.js',
    other: [
        './system.js',
        './user.js',
    ],
    source: './',
};
Assets.other.push(Assets.source + Assets.main);

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
    del([Assets.dest + '/*.js'], cb);
});

// Run the babel transpiler to convert from ES2015 to ES5
gulp.task('es6to5', function es6To5Task() {
    return gulp.src(Assets.other)
        .pipe(babel({
            presets: ['es2015'],
        }))
        .pipe(gulp.dest(Assets.source + Assets.dest));
});

// Check the code meets the following standards outlined in .jshintrc
gulp.task('jshint', function jsHintTask() {
    return gulp.src(Assets.source + Assets.main)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

// Uglify aka minify the main file
gulp.task('uglify', ['es6to5'], function uglifyTask() {
    return gulp.src(Assets.source + Assets.dest + '/' + Assets.main)
        .pipe(concat(Assets.minified))
        .pipe(uglify(_uglifySettings))
        .pipe(rename(Assets.minified))
        .pipe(gulp.dest(Assets.source + Assets.dest));
});

// Watch for changes to the main file
gulp.task('watch', function watchTask() {
    gulp.watch(Assets.source + Assets.main, ['jshint', 'uglify']);
});

// Update version numbers based on the main file version comment
gulp.task('version', function versionTask() {
    // SemVer matching is done using (?:\d+\.){2}\d+

    var VERSION_NUMBER = 1;
    var reVersion = /\n\s*\*\s+Version:\s+((?:\d+\.){2}\d+)/;
    var version = fs.readFileSync(Assets.source + Assets.main, {
        encoding: 'utf8',
    })

    // Match is found in the 2nd element
    .match(reVersion)[VERSION_NUMBER];

    var streams = merge();

    // package.json version property
    streams.add(
        gulp.src(Assets.source + 'package.json')
        .pipe(replace(/"version":\s+"(?:\d+\.){2}\d+",/, '"version": "' + version + '",'))
        .pipe(gulp.dest(Assets.source))
    );

    // README.md version number
    streams.add(
        gulp.src(Assets.source + 'README.md')
        .pipe(replace(/^#\s+([\w\-]+)\s+-\s+v(?:\d+\.){2}\d+/, '# $1 - v' + version))
        .pipe(gulp.dest(Assets.source))
    );

    return streams;
});

// Register the default task
gulp.task('default', ['version', 'jshint', 'uglify']);

// 'gulp es6to5' to transpile from ES2015 to ES5
// 'gulp jshint' to check the syntax
// 'gulp uglify' to uglify the main file
// 'gulp watch' to watch for changes to the main file
// 'gulp version' to update the version numbers based on the main file version comment
