/*
 * Loady module
 * https://github.com/softwarespot/loady
 * Author: softwarespot
 * Licensed under the MIT license
 * Version: 0.1.0
 *
 * Loady module - Load external JavaScript file(s) and append it to the head of the current document
 * Note: This is NOT a replacement for module loaders available on the market
 */
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

; // jshint ignore:line
(function (global, name, iLoader, undefined) {
    // Constants

    // Public API
    var _loadyAPI = function _loadyAPI(sourceFiles, callback) {
        // Create an instance of the internal loader class
        var loady = new iLoader();

        // Load the source file(s)
        loady.load(sourceFiles, callback);
    };

    // Store a 'module' reference
    var module = global.module;

    // Store a 'define' reference
    var define = global.define;

    if (module !== undefined && module.exports) {
        // Node.js Module
        module.exports = _loadyAPI;
    } else if (typeof define === 'function' && define.amd) {
        // AMD Module
        global.define(name, [], _loadyAPI);
    }

    // Check if Loady has already been registered beforehand and if so, throw an error
    if (global[name] !== undefined) {
        throw new Error('Loady appears to be already registered with the global object, therefore the module has not been registered.');
    }

    // Append the Loady API to the global object reference
    global[name] = _loadyAPI;
})(window, 'loady', (function (global) {
    // Can't be 'this' with babelJS, as it gets set to 'undefined'
    // Constants

    // Version number of the module
    var VERSION = '0.1.0';

    var _dataAttributes = {
        SOURCE_FILE: 'data-loady-sourcefile'
    };

    // Store the document object reference
    var document = global.document;

    // Store the first head node
    var _head = document.head || document.getElementsByTagName('head')[0];

    // Regular expression to strip the JS extension
    var _reJsExtension = /\.js$/;

    // Store previously loaded source file(s)
    var _storageFiles = [];

    // Store the state of the source file(s) i.e. true or false
    var _storageState = [];

    // Return strings of toString() found on the Object prototype
    // Based on the implementation by lodash inc. is* function as well
    var _objectStrings = {
        FUNCTION: '[object Function]',
        GENERATOR: '[object GeneratorFunction]',
        STRING: '[object String]'
    };

    // Store the toString method
    var _objectToString = global.Object.prototype.toString;

    /**
     * Check if a variable is an array datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True the value is an array datatype; otherwise, false
     */
    var isArray = global.Array.isArray;

    /**
     * Check if a variable is a function datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True the value is a function datatype; otherwise, false
     */
    function isFunction(value) {
        var tag = isObject(value) ? _objectToString.call(value) : '';
        return tag === _objectStrings.FUNCTION || tag === _objectStrings.GENERATOR;
    }

    /**
     * Check if a variable is an object
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True the value is an object; otherwise, false
     */
    function isObject(value) {
        // Store the typeof value
        var type = typeof value;

        // !!value is basically checking if value is not 'truthy' e.g. null or zero and then inverts that boolean value
        // So, !'Some test' is false and then inverting false is true. There if value contains 'something', continue
        return !!value && (type === 'object' || type === 'function');
    }

    /**
     * Check if a variable is a string datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True the value is a string datatype; otherwise, false
     */
    function isString(value) {
        return typeof value === 'string' || _objectToString.call(value) === _objectStrings.STRING;
    }

    /**
     * ILoader class
     */
    return (function () {
        /**
         * Constructor for the class
         *
         * @return {undefined}
         */

        function ILoader() {
            _classCallCheck(this, ILoader);

            this.destroy();
        }

        /**
         * Tidy up resources i.e. good housekeeping
         *
         * @return {undefined}
         */

        _createClass(ILoader, [{
            key: 'destroy',
            value: function destroy() {
                // Final callback function after all scripts have been loaded successfully or not
                this._callback = null;

                // Currently loaded total count
                //
                // Note: The loaded count is set to -1, due to this.onCompleted incrementing by 1 and checking against this._length,
                // which right now is set to 0. So this is utilised during pre-checks
                this._loaded = -1;

                // An array of successfully loaded source file(s)
                this._called = null;

                // An array of source file(s) initially passed to the module
                this._files = null;

                // Length of the source file(s) initially passed to the module
                this._length = 0;
            }

            /**
             * Load an array of source file(s)
             *
             * @param {array} sourceFiles An array of source file(s). Note: .js is optional and will be appended if not present
             * @param {function} callback Callback function to invoke on completion successful or not.
             * The arguments passed to the callback function is an array of loaded scripts and a success parameter of either true or false
             * @return {undefined}
             */
        }, {
            key: 'load',
            value: function load(sourceFiles, callback) {
                // This is the only error thrown, due to a callback being required
                if (!isFunction(callback)) {
                    throw new global.Error('Loady: The callback function argument is not a valid function type.');
                }

                // Destroy the previous contents
                this.destroy();

                // Coerce as an array if the source file is a string
                if (isString(sourceFiles)) {
                    sourceFiles = [sourceFiles];
                }

                // Set the callback function property
                this._callback = callback;

                // Check if the source file(s) argument is not an array or is empty
                if (!isArray(sourceFiles) || sourceFiles.length === 0) {
                    this.onCompleted(false);
                    return;
                }

                // Set to 0, as now all the important pre-checks have passed
                this._loaded = 0;
                this._called = [];
                this._files = sourceFiles;
                this._length = sourceFiles.length;

                for (var i = 0, _length = this._length; i < _length; i++) {
                    // Strip and append .js to the source file
                    var sourceFile = sourceFiles[i].replace(_reJsExtension, '') + '.js';

                    // Check for duplicate source file(s)
                    var index = _storageFiles.indexOf(sourceFile);
                    if (index !== -1) {
                        this.onCompleted(_storageState[index]);
                        continue;
                    }

                    // Load the script file and append to the current document
                    this.loadScript(sourceFile);
                }
            }

            /**
             * Load a script and append to the first HEAD node in the DOM
             *
             * @param {string} sourceFile Script source location that can be absolute or relative
             * @return {undefined}
             */
        }, {
            key: 'loadScript',
            value: function loadScript(sourceFile) {
                var node = document.createElement('SCRIPT');
                node.src = sourceFile;
                // node.text = file;

                // node.type = 'text/javascript';
                // node.charset = 'utf-8';

                node.async = true;

                node.setAttribute(_dataAttributes.SOURCE_FILE, sourceFile);

                // Attach events
                // Note: Bind is used to 'bind' to the context of 'this' i.e. the current object
                node.addEventListener('load', this.onLoad.bind(this), false);
                node.addEventListener('error', this.onLoad.bind(this), false);

                // Append to the HEAD node
                _head.appendChild(node);

                // Push to the internal storage
                _storageFiles.push(sourceFile);
            }

            /**
             * Increment the loaded scripts property and invoke the callback function on completion
             *
             * @param {boolean} isSuccess Whether the request was successful or not
             * @return {undefined}
             */
        }, {
            key: 'onCompleted',
            value: function onCompleted(isSuccess) {
                // If not equal to the boolean type and true, then automatically assume as false
                if (isSuccess !== true) {
                    isSuccess = false;
                }

                // Increment the loaded total count
                this._loaded++;

                if (this._length === this._loaded) {
                    this._callback.apply(this, [this._called, isSuccess]);
                    this.destroy();
                }
            }

            /**
             * The 'load' or 'error' callback function for the event listeners
             *
             * @param {event} event Event object passed by the event listener
             * @return {undefined}
             */
        }, {
            key: 'onLoad',
            value: function onLoad(event) {
                // Store the type of event and whether it was a 'load' or 'error' type event
                var type = event.type;
                var isLoaded = type === 'load';

                if (isLoaded || type === 'error') {
                    var node = event.currentTarget || event.srcElement;
                    if (!node) {
                        return;
                    }

                    // Remove assigned events
                    node.removeEventListener('load', this.onLoad, false);
                    node.removeEventListener('error', this.onLoad, false);

                    // Push the state of the source file. If loaded will be true; otherwise, false
                    _storageState.push(isLoaded);

                    // Display details about the inserted SCRIPT node and script
                    if (isLoaded) {
                        // Get the source file directly from the data-* attribute
                        var sourceFile = node.getAttribute(_dataAttributes.SOURCE_FILE);

                        // Push to the successfully loaded scripts
                        this._called.push(sourceFile);
                    }

                    this.onCompleted(true);
                }
            }

            /**
             * Get the version number of the module
             *
             * @return {string} Module version number
             */
        }, {
            key: 'getVersion',
            value: function getVersion() {
                return VERSION;
            }
        }]);

        return ILoader;
    })();
})(window)); // Can't be 'this' with babelJS, as it gets set to 'undefined'