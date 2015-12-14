// Loady module
//
// https://github.com/softwarespot/loady
// Author: softwarespot
// Licensed under the MIT license
// Version: 0.1.0

// Loady module - Load external JavaScript file(s) and append it to the head of the current document
// Note: This is NOT a replacement for module loaders available on the market

// Constants

// Version number of the module
const VERSION = '0.1.0';

// Data attribute to distinguish between a standard script element and a 'loady' script element
const DATA_ATTRIBUTE_SOURCE_FILE = 'data-loady-sourcefile';

// indexOf value when a value is not found
const IS_NOT_FOUND = -1;

// Fields

// Store the document object reference
const _document = window.document;

// Store the first head node
const _head = _document.head || _document.getElementsByTagName('head')[0];

// Regular expression to strip the JS extension
const _reJSExtension = /(?:\.js$)/;

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
const _objectToString = window.Object.prototype.toString;

// Helper methods

/**
 * Check if a variable is a function datatype
 *
 * @param {mixed} value Value to check
 * @returns {boolean} True, the value is a function datatype; otherwise, false
 */
function _isFunction(value) {
    const tag = _objectToString.call(value);
    return tag === _objectStringsFunction || tag === _objectStringsGenerator;
}

/**
 * Check if a variable is an array datatype
 *
 * @param {mixed} value Value to check
 * @returns {boolean} True, the value is an array datatype; otherwise, false
 */
const _isArray = _isFunction(window.Array.isArray) ? window.Array.isArray : (value) => {
    return _objectToString.call(value) === _objectStringsArray;
};

/**
 * Check if a variable is a string datatype
 *
 * @param {mixed} value Value to check
 * @returns {boolean} True, the value is a string datatype; otherwise, false
 */
function _isString(value) {
    return typeof value === 'string' || _objectToString.call(value) === _objectStringsString;
}

// Interface

/**
 * Loady class
 */
class Loady {
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
     * @return {promise} Returns a promise which in turns passes the successfully loaded scripts, regardless or success or failure
     */
    load(sourceFiles) {
        // Coerce as an array if not already an array
        if (!_isArray(sourceFiles)) {
            sourceFiles = [sourceFiles];
        }

        // Remove invalid source files(s)
        sourceFiles = sourceFiles.filter((sourceFile) => {
            return _isString(sourceFile) && sourceFile.length > 0;
        });

        // Destroy the previous contents
        this._destroy();

        // Create a new promise object
        const promise = new window.Promise((resolve, reject) => {
            // Expose the internal resolve and reject functions
            this._resolve = resolve;
            this._reject = reject;
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
        sourceFiles
            .map((sourceFile) => {
                // Strip and append ".js" to the source file if it doesn't already exist
                return sourceFile.replace(_reJSExtension, '') + '.js';
            })
            .filter((sourceFile) => {
                // Check for duplicate source file(s) that were loaded in the past
                const index = _storageFiles.indexOf(sourceFile);
                const isNotFound = index === IS_NOT_FOUND;

                // If found, then check the current state
                if (!isNotFound) {
                    this._onCompleted(_storageState[index]);
                }

                // Filter only those which haven't yet been loaded
                return isNotFound;
            })
            .forEach((sourceFile) => {
                // Load the script file and append to the current document
                this._loadScript(sourceFile);
            });

        // Return the promise
        return promise;
    }

    /**
     * Tidy up resources i.e. good housekeeping
     *
     * @return {undefined}
     */
    _destroy() {
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
    _loadScript(sourceFile) {
        const node = _document.createElement('script');
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
    _onCompleted() {
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
    _onLoad(event) {
        // Store the type of event and whether it was a 'load' or 'error' type event
        const type = event.type;
        const isError = type === 'error';
        const isSuccess = type === 'load';

        // If loading failed and globally isSuccess is true, then set to false
        // This is only done once if a single failure takes place
        if (!isSuccess && this._isSuccess) {
            this._isSuccess = isSuccess;
        }

        if (isSuccess || isError) {
            const node = event.currentTarget || event.srcElement;

            // A serious error occurred
            if (!node) {
                return;
            }

            // Remove assigned events
            node.removeEventListener('load', this._onLoad, false);
            node.removeEventListener('error', this._onLoad, false);

            // Get the source file directly from the data-* attribute. Could use node.getAttribute('src') as well
            const sourceFile = node.getAttribute(DATA_ATTRIBUTE_SOURCE_FILE);

            // Update the state of the source file using the index position of the source file in _sourceFiles
            const index = _storageFiles.indexOf(sourceFile);
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
}

// Public API

// Create an instance of the internal loady class
const loady = new Loady();

// Load the source file(s)
export const load = (sourceFiles) => {
    return loady.load(sourceFiles);
};
