# Loady v0.2.0

### Note: This is still work in progress, so expect it to be a little problematic on certain browsers

## What is Loady?

Many script loaders exist in the real world and I'm in no way trying be the "next big thing", as I believe the likes of [RequireJS](https://github.com/jrburke/requirejs) are adequate enough for daily use. I simply created this as a way to further improve my knowledge of JavaScript and experiment with features that I necessarily wouldn't mess around with.

If you're unaware of just what a script loader is, read the links below.

## How to use

```html
    <!--Use the minified version for better performance-->
    <script src="loady_es5.min.js"></script>

    <script>
        // An array of strings or a single string can be passed as the first argument.
        // It returns an ES2015 promise which in turn passes the scripts that were either successfully loaded or not
        loady.load(['myScript1.js', 'myScript2.js', 'myScript3'])
        .then(function success(scripts) {
            console.log('Success, the following scripts were loaded into the current document { %o }', scripts);
        })
        .catch(function failed() {
            console.log('An error occurred, though the following scripts were loaded into the current document { %o }', scripts);
        });
    </script>
```

## ES2015

The module is written using ES2015, but is transpiled using [babel](https://babeljs.io) to ES5. The reason for using [babel](https://babeljs.io), is not all browsers currently support the ES2015 specification, though will likely change very soon. The transpiled files are located in the `dist` directory.

## Contribute

To contribute to the project, you will first need to install [gulp](http://gulpjs.com) globally on your system. Once installation has completed, change the working directory to the module's location and run the following command:

```shell
    npm install
```

After installation of the local modules, you're ready to start contributing to the project. Before you submit your PR, please don't forget to call `gulp`, which will run against [JSHint](http://jshint.com) for any errors, but will also minify the module and transpile using [babel](https://babeljs.io).

##### Watch
Call the following command to start 'watching' for any changes to the main JavaScript file(s). This will automatically invoke JSHint and Uglify.
```shell
    gulp watch
```

##### JSHint
Call the following command to invoke JSHint and check that the changes meet the requirements set in .jshintrc.
```shell
    gulp jshint
```

##### Uglify
Call the following command to invoke Uglify, which will minify the main JavaScript file(s) and output to a .min.js file respectively.
```shell
    gulp uglify
```

##### Build
Call the following command to invoke both babel, JSHint and Uglify.
```shell
    gulp
```

## Sources

The following sources were used to aid in creating an efficient and readable script loader.

- http://mawaha.com/deferring-script-loading-javascript/
- http://stackoverflow.com/questions/3248384/document-createelementscript-synchronously
- http://www.html5rocks.com/en/tutorials/speed/script-loading/
- http://zcourts.com/2011/10/06/dynamically-requireinclude-a-javascript-file-into-a-page-and-be-notified-when-its-loaded/
- https://css-tricks.com/snippets/javascript/async-script-loader-with-callback/
- https://github.com/addyosmani/basket.js/blob/gh-pages/lib/basket.js
- https://github.com/jrburke/requirejs/blob/master/require.js
- https://varvy.com/pagespeed/defer-loading-javascript.html
