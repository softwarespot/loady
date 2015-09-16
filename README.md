# Loady v0.1.0

### Note: This is still work in progress, so expect it to be a little problematic on certain browsers

## What is Loady?

Many script loaders exist in the real world and I'm in no way trying be the "next big thing", as I believe the likes of [RequireJS](https://github.com/jrburke/requirejs) are adequate enough for daily usage. I simply created this as a way to further improve my knowledge of JavaScript and experiment with features that I necessarily would mess around with.

If you're unaware of just what a script loader is, read the links below.

## How to use

```html
    <script src="loady.js"></script>
    <script>
        // An array of strings or a string can be passed as the first argument, with the second being a callback function.
        // Notice how .js is emitted from the 3rd script, as this is automatically appended.
        // The callback function is passed an array of loaded scripts and whether all scripts were loaded successfully
        loady(['myScript1.js', 'myScript2.js', 'myScript3'], function (scripts, isSuccess) {
            if (isSuccess) {
                console.log('Success, the following scripts were loaded into the' +
                    ' current document { %o }', scripts);
            } else {
                console.log('An error occurred, though the following scripts were loaded not' +
                    ' loaded into the curren document { %o }', scripts);
            }
        });
    </script>
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
