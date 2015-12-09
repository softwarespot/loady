'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

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
; // jshint ignore:line
(function (global, name, ILoader, undefined) {
    // Constants

    // Public API
    var _loadyAPI = function _loadyAPI(sourceFiles) {
        // Create an instance of the internal loader class
        var loady = new ILoader();

        // Load the source file(s)
        return loady.load(sourceFiles);
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
        throw new global.Error('Loady appears to be already registered with the global object, therefore the module has not been registered.');
    }

    // Append the Loady API to the global object reference
    global[name] = _loadyAPI;
})(window, 'loady', (function (global) {
    // Can't be 'this' with babelJS, as it gets set to 'undefined'
    // Constants

    // Version number of the module
    var VERSION = '0.1.0';

    // Data attribute to distinguish between a standard script element and a 'loady' script element
    var DATA_ATTRIBUTE_SOURCE_FILE = 'data-loady-sourcefile';

    // indexOf value when a value is not found
    var IS_NOT_FOUND = -1;

    // Store the document object reference
    var _document = global.document;

    // Store the first head node
    var _head = _document.head || _document.getElementsByTagName('head')[0];

    // Regular expression to strip the JS extension
    var _reJSExtension = /(?:\.js$)/;

    // Store previously loaded source file(s)
    var _storageFiles = [];

    // Store the state of the source file(s) i.e. true or false
    var _storageState = [];

    // Return strings of toString() found on the Object prototype
    // Based on the implementation by lodash inc. is* function as well
    var _objectStringsArray = '[object Array]';
    var _objectStringsFunction = '[object Function]';
    var _objectStringsGenerator = '[object GeneratorFunction]';
    var _objectStringsString = '[object String]';

    // Store the toString method
    var _objectToString = global.Object.prototype.toString;

    /**
     * Check if a variable is a function datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is a function datatype; otherwise, false
     */
    function _isFunction(value) {
        var tag = _isObject(value) ? _objectToString.call(value) : null;
        return tag === _objectStringsFunction || tag === _objectStringsGenerator;
    }

    /**
     * Check if a variable is an array datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is an array datatype; otherwise, false
     */
    var _isArray = _isFunction(global.Array.isArray) ? global.Array.isArray : function (value) {
        return _objectToString.call(value) === _objectStringsArray;
    };

    /**
     * Check if a variable is an object
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is an object; otherwise, false
     */
    function _isObject(value) {
        // Store the typeof value
        var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);

        // !!value is basically checking if value is not 'truthy' e.g. null or zero and then inverts that boolean value
        // So, !'Some test' is false and then inverting false is true. There if value contains 'something', continue
        return !!value && (type === 'object' || type === 'function');
    }

    /**
     * Check if a variable is a string datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is a string datatype; otherwise, false
     */
    function _isString(value) {
        return typeof value === 'string' || _objectToString.call(value) === _objectStringsString;
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

            this._destroy();
        }

        /**
         * Get the version number of the module
         *
         * @return {string} Module version number
         */

        _createClass(ILoader, [{
            key: 'getVersion',
            value: function getVersion() {
                return VERSION;
            }

            /**
             * Load an array of source file(s)
             *
             * @param {array} sourceFiles An array of source file(s). Note: .js is optional and will be appended if not present
             * @return {promise} Returns a promise which in turns passes the successfully loaded scripts, regardless or success or failure
             */

        }, {
            key: 'load',
            value: function load(sourceFiles) {
                var _this = this;

                // Coerce as an array if not already an array
                if (!_isArray(sourceFiles)) {
                    sourceFiles = [sourceFiles];
                }

                // Remove invalid source files(s)
                sourceFiles = sourceFiles.filter(function (sourceFile) {
                    return _isString(sourceFile) && sourceFile.length > 0;
                });

                // Destroy the previous contents
                this._destroy();

                // Create a new promise object
                var promise = new window.Promise(function (resolve, reject) {
                    // Expose the internal resolve and reject functions
                    _this._resolve = resolve;
                    _this._reject = reject;
                });

                // Check if the source file(s) argument is not an array or is empty
                if (sourceFiles.length === 0) {
                    // Set to false, as a series error occurred before loading
                    this._isSuccess = false;
                    this._onCompleted();

                    // Return the promise
                    return promise;
                }

                // Set to 0, as all necessary pre-checks have taken place
                this._allLoaded = 0;
                this._called = [];
                this._initiallyLoaded = sourceFiles.length;

                // Map, filter and iterate over the passed source files(s)
                sourceFiles.map(function (sourceFile) {
                    // Strip and append ".js" to the source file if it doesn't already exist
                    return sourceFile.replace(_reJSExtension, '') + '.js';
                }).filter(function (sourceFile) {
                    // Check for duplicate source file(s) that were loaded in the past
                    var index = _storageFiles.indexOf(sourceFile);
                    var isNotFound = index === IS_NOT_FOUND;

                    // If found, then check the current state
                    if (!isNotFound) {
                        _this._onCompleted(_storageState[index]);
                    }

                    // Filter only those which haven't yet been loaded
                    return isNotFound;
                }).forEach(function (sourceFile) {
                    // Load the script file and append to the current document
                    _this._loadScript(sourceFile);
                });

                // Return the promise
                return promise;
            }

            /**
             * Tidy up resources i.e. good housekeeping
             *
             * @return {undefined}
             */

        }, {
            key: '_destroy',
            value: function _destroy() {
                // Currently loaded total count
                //
                // Note: The loaded count is set to -1, due to this._onCompleted incrementing by 1 and checking against this._initiallyLoaded,
                // which right now is set to 0. So this is utilised during pre-checks
                this._allLoaded = -1;

                // An array of successfully loaded source file(s)
                this._called = null;

                // Length of the source file(s) initially passed to the module
                this._initiallyLoaded = 0;

                // Set whether all scripts were loaded successfully
                this._isSuccess = true;

                // Promise related function callbacks
                this._resolve = null;
                this._reject = null;
            }

            /**
             * Load a script and append to the first HEAD node in the DOM
             *
             * @param {string} sourceFile Script source location that can be absolute or relative
             * @return {undefined}
             */

        }, {
            key: '_loadScript',
            value: function _loadScript(sourceFile) {
                var node = _document.createElement('script');
                node.src = sourceFile;

                // node.text = file;

                // node.type = 'text/javascript';
                // node.charset = 'utf-8';

                // Set script loading to be asynchronous
                node.async = true;

                node.setAttribute(DATA_ATTRIBUTE_SOURCE_FILE, sourceFile);

                // Attach events
                // Note: Bind is used to 'bind' to the context of 'this' i.e. the current object
                node.addEventListener('load', this._onLoad.bind(this), false);
                node.addEventListener('error', this._onLoad.bind(this), false);

                // Append to the HEAD node
                _head.appendChild(node);

                // Push to the internal storage
                _storageFiles.push(sourceFile);
            }

            /**
             * Increment the loaded scripts property and invoke either resolve or reject on success or error
             *
             * @return {undefined}
             */

        }, {
            key: '_onCompleted',
            value: function _onCompleted() {
                // Increment the loaded total count
                this._allLoaded++;

                // If the initial loaded count is the same as the actual loaded count, then assume all scripts were loaded
                if (this._initiallyLoaded === this._allLoaded) {
                    if (this._isSuccess) {
                        this._resolve(this._called);
                    } else {
                        this._reject(this._called);
                    }

                    this._destroy();
                }
            }

            /**
             * The 'load' or 'error' callback function for the event listeners
             *
             * @param {event} event Event object passed by the event listener
             * @return {undefined}
             */

        }, {
            key: '_onLoad',
            value: function _onLoad(event) {
                // Store the type of event and whether it was a 'load' or 'error' type event
                var type = event.type;
                var isError = type === 'error';
                var isSuccess = type === 'load';

                // If loading failed and globally isSuccess is true, then set to false
                // This is only done once if a single failure takes place
                if (!isSuccess && this._isSuccess) {
                    this._isSuccess = isSuccess;
                }

                if (isSuccess || isError) {
                    var node = event.currentTarget || event.srcElement;

                    // A serious error occurred
                    if (!node) {
                        return;
                    }

                    // Remove assigned events
                    node.removeEventListener('load', this._onLoad, false);
                    node.removeEventListener('error', this._onLoad, false);

                    // Get the source file directly from the data-* attribute. Could use node.getAttribute('src') as well
                    var sourceFile = node.getAttribute(DATA_ATTRIBUTE_SOURCE_FILE);

                    // Update the state of the source file using the index position of the source file in _sourceFiles
                    var index = _storageFiles.indexOf(sourceFile);
                    if (index !== IS_NOT_FOUND) {
                        _storageState[index] = isSuccess;
                    }

                    if (isSuccess) {
                        // Push to the successfully loaded scripts if loading was successful
                        this._called.push(sourceFile);
                    }

                    this._onCompleted(isSuccess);
                }
            }
        }]);

        return ILoader;
    })();
})(window));