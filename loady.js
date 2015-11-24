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
((global, name, ILoader, undefined) => {
    // Constants

    // Public API
    const _loadyAPI = (sourceFiles, callback) => {
        // Create an instance of the internal loader class
        const loady = new ILoader();

        // Load the source file(s)
        loady.load(sourceFiles, callback);
    };

    // Store a 'module' reference
    const module = global.module;

    // Store a 'define' reference
    const define = global.define;

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

})(window, 'loady', (global) => { // Can't be 'this' with babelJS, as it gets set to 'undefined'
    // Constants

    // Version number of the module
    const VERSION = '0.1.0';

    // Data attribute to distinguish between a standard script element and a 'loady' script element
    var DATA_ATTRIBUTE_SOURCE_FILE = 'data-loady-sourcefile';

    // Store the document object reference
    const document = global.document;

    // Store the first head node
    const _head = document.head || document.getElementsByTagName('head')[0];

    // Regular expression to strip the JS extension
    const _reJSExtension = /\.js$/;

    // Store previously loaded source file(s)
    const _storageFiles = [];

    // Store the state of the source file(s) i.e. true or false
    const _storageState = [];

    // Return strings of toString() found on the Object prototype
    // Based on the implementation by lodash inc. is* function as well
    const _objectStringsArray = '[object Array]';
    const _objectStringsFunction = '[object Function]';
    const _objectStringsGenerator = '[object GeneratorFunction]';
    const _objectStringsString = '[object String]';

    // Store the toString method
    const _objectToString = global.Object.prototype.toString;

    /**
     * Check if a variable is a function datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is a function datatype; otherwise, false
     */
    function _isFunction(value) {
        const tag = _isObject(value) ? _objectToString.call(value) : null;
        return tag === _objectStringsFunction || tag === _objectStringsGenerator;
    }

    /**
     * Check if a variable is an array datatype
     *
     * @param {mixed} value Value to check
     * @returns {boolean} True, the value is an array datatype; otherwise, false
     */
    const _isArray = _isFunction(global.Array.isArray) ? global.Array.isArray : (value) => {
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
        const type = typeof value;

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
    return class ILoader {
        /**
         * Constructor for the class
         *
         * @return {undefined}
         */
        constructor() {
            this._destroy();
        }

        /**
         * Get the version number of the module
         *
         * @return {string} Module version number
         */
        getVersion() {
            return VERSION;
        }

        /**
         * Load an array of source file(s)
         *
         * @param {array} sourceFiles An array of source file(s). Note: .js is optional and will be appended if not present
         * @param {function} callback Callback function to invoke on completion successful or not
         * The arguments passed to the callback function is an array of loaded scripts and a success parameter of either true or false
         * @return {undefined}
         */
        load(sourceFiles, callback) {
            // This is the only error thrown, due to a callback being required
            if (!_isFunction(callback)) {
                throw new global.Error('Loady: The callback function argument is not a valid function type.');
            }

            // Destroy the previous contents
            this._destroy();

            // Coerce as an array if the source file is a string
            if (_isString(sourceFiles)) {
                sourceFiles = [sourceFiles];
            }

            // Set the callback function property
            this._callback = callback;

            // Check if the source file(s) argument is not an array or is empty
            if (!_isArray(sourceFiles) || sourceFiles.length === 0) {
                this._onCompleted(false);
                return;
            }

            // Set to 0, as now all the important pre-checks have passed
            this._loaded = 0;
            this._called = [];
            this._files = sourceFiles;
            this._length = sourceFiles.length;

            for (let i = 0, length = this._length; i < length; i++) {
                // Strip and append .js to the source file
                const sourceFile = sourceFiles[i].replace(_reJSExtension, '') + '.js';

                // Check for duplicate source file(s) that were loaded in the past
                const index = _storageFiles.indexOf(sourceFile);
                if (index !== -1) {
                    this._onCompleted(_storageState[index]);
                    continue;
                }

                // Load the script file and append to the current document
                this._loadScript(sourceFile);
            }
        }

        /**
         * Tidy up resources i.e. good housekeeping
         *
         * @return {undefined}
         */
        _destroy() {
            // Final callback function after all scripts have been loaded successfully or not
            this._callback = null;

            // Currently loaded total count
            //
            // Note: The loaded count is set to -1, due to this._onCompleted incrementing by 1 and checking against this._length,
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
         * Load a script and append to the first HEAD node in the DOM
         *
         * @param {string} sourceFile Script source location that can be absolute or relative
         * @return {undefined}
         */
        _loadScript(sourceFile) {
            const node = document.createElement('script');
            node.src = sourceFile;

            // node.text = file;

            // node.type = 'text/javascript';
            // node.charset = 'utf-8';

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
         * Increment the loaded scripts property and invoke the callback function on completion
         *
         * @param {boolean} isSuccess Whether the request was successful or not
         * @return {undefined}
         */
        _onCompleted(isSuccess) {
            // If not equal to the boolean type and true, then automatically assume as false
            if (isSuccess !== true) {
                isSuccess = false;
            }

            // Increment the loaded total count
            this._loaded++;

            if (this._length === this._loaded) {
                this._callback.apply(this, [this._called, isSuccess]);
                this._destroy();
            }
        }

        /**
         * The 'load' or 'error' callback function for the event listeners
         *
         * @param {event} event Event object passed by the event listener
         * @return {undefined}
         */
        _onLoad(event) {
            // Store the type of event and whether it was a 'load' or 'error' type event
            const type = event.type;
            const isLoaded = type === 'load';

            if (isLoaded || type === 'error') {
                const node = event.currentTarget || event.srcElement;
                if (!node) {
                    return;
                }

                // Remove assigned events
                node.removeEventListener('load', this._onLoad, false);
                node.removeEventListener('error', this._onLoad, false);

                // Display details about the inserted SCRIPT node and script
                if (isLoaded) {
                    // Get the source file directly from the data-* attribute. Could use node.getAttribute('src')
                    const sourceFile = node.getAttribute(DATA_ATTRIBUTE_SOURCE_FILE);

                    // Updated the state of the source file using the index position of the source file in _sourceFiles
                    const index = _storageFiles.indexOf(sourceFile);
                    if (index !== -1) {
                        _storageState[index] = isLoaded;
                    }

                    // Push to the successfully loaded scripts
                    this._called.push(sourceFile);
                }

                this._onCompleted(true);
            }
        }
    };
}(window));
