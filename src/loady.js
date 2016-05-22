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
const document = window.document;

// Store the first head node
const head = document.head;

// Regular expression to strip the JS extension
const reJSExtension = /(?:\.js$)/;

// Store previously loaded source file(s)
const storageFiles = [];

// Store the state of the source file(s) i.e. true or false
const storageState = [];

// Store the toString method
const nativeObjectToString = Object.prototype.toString;

// Helper methods

/**
 * Check if a variable is an array datatype
 *
 * @param {mixed} value Value to check
 * @returns {boolean} True, the value is an array datatype; otherwise, false
 */
const isArray = Array.isArray;

/**
 * Check if a variable is a string datatype
 *
 * @param {mixed} value Value to check
 * @returns {boolean} True, the value is a string datatype; otherwise, false
 */
function isString(value) {
    return typeof value === 'string' || nativeObjectToString.call(value) === '[object String]';
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
        this.destroy();
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
        // Coerce as an array if not already one
        if (!isArray(sourceFiles)) {
            sourceFiles = [sourceFiles];
        }

        // Remove invalid source files(s)
        sourceFiles = sourceFiles.filter((sourceFile) => isString(sourceFile) && sourceFile.length > 0);

        // Destroy the previous contents
        this.destroy();

        // Create a new promise object
        const promise = new Promise((resolve, reject) => {
            // Expose the internal resolve and reject functions
            this.resolve = resolve;
            this.reject = reject;
        });

        // Check if the source file(s) argument is not an array or is empty
        if (sourceFiles.length === 0) {
            // Set to false, as a series error occurred before loading
            this.isSuccess = false;
            this.onCompleted();

            // Return the promise
            return promise;
        }

        // Set to 0, as all necessary pre-checks have taken place
        this.allLoaded = 0;
        this.called = [];
        this.initiallyLoaded = sourceFiles.length;

        // Map, filter and iterate over the passed source files(s)
        sourceFiles

            // Strip and append ".js" to the source file if it doesn't already exist
            .map((sourceFile) => sourceFile.replace(reJSExtension, '.js'))

            .filter((sourceFile) => {
                // Check for duplicate source file(s) that were loaded in the past
                const index = storageFiles.indexOf(sourceFile);
                const isNotFound = (index === IS_NOT_FOUND);

                // If found, then check the current state
                if (!isNotFound) {
                    this.onCompleted(storageState[index]);
                }

                // Filter only those which haven't yet been loaded
                return isNotFound;
            })
            .forEach((sourceFile) => {
                // Load the script file and append to the current document
                this.loadScript(sourceFile);
            });

        // Return the promise
        return promise;
    }

    /**
     * Tidy up resources i.e. good housekeeping
     *
     * @return {undefined}
     */
    destroy() {
        // Currently loaded total count
        //
        // Note: The loaded count is set to -1, due to this.onCompleted incrementing by 1 and checking against this.initiallyLoaded,
        // which right now is set to 0. So this is utilised during pre-checks
        this.allLoaded = -1;

        // An array of successfully loaded source file(s)
        this.called = null;

        // Length of the source file(s) initially passed to the module
        this.initiallyLoaded = 0;

        // Set whether all scripts were loaded successfully
        this.isSuccess = true;

        // Promise related function callbacks
        this.resolve = null;
        this.reject = null;
    }

    /**
     * Load a script and append to the first HEAD node in the DOM
     *
     * @param {string} sourceFile Script source location that can be absolute or relative
     * @return {undefined}
     */
    loadScript(sourceFile) {
        // Uses HTMLScriptElement, URL: https://developer.mozilla.org/en/docs/Web/API/HTMLScriptElement
        const node = document.createElement('script');
        node.src = sourceFile;

        // node.text = file;

        // node.type = 'text/javascript';
        // node.charset = 'utf-8';
        // node.crossOrigin = 'anonymous';

        // Set script loading to be asynchronous
        node.async = true;

        node.setAttribute(DATA_ATTRIBUTE_SOURCE_FILE, sourceFile);

        // Attach events
        // Note: Bind is used to 'bind' to the context of 'this' i.e. the current object
        node.addEventListener('load', this.onLoad.bind(this), false);
        node.addEventListener('error', this.onLoad.bind(this), false);

        // Append to the HEAD
        head.appendChild(node);

        // Push to the internal storage
        storageFiles.push(sourceFile);
    }

    /**
     * Increment the loaded scripts property and invoke either resolve or reject on success or error
     *
     * @return {undefined}
     */
    onCompleted() {
        // Increment the loaded total count
        this.allLoaded++;

        // If the initial loaded count is the same as the actual loaded count, then assume all scripts were loaded
        if (this.initiallyLoaded === this.allLoaded) {
            if (this.isSuccess) {
                this.resolve(this.called);
            } else {
                this.reject(this.called);
            }

            this.destroy();
        }
    }

    /**
     * The 'load' or 'error' callback function for the event listeners
     *
     * @param {event} event Event object passed by the event listener
     * @return {undefined}
     */
    onLoad(event) {
        // Store the type of event and whether it was a 'load' or 'error' type event
        const type = event.type;
        const isError = type === 'error';
        const isSuccess = type === 'load';

        // If loading failed and globally isSuccess is true, then set to false
        // This is only done once if a single failure takes place
        if (!isSuccess && this.isSuccess) {
            this.isSuccess = isSuccess;
        }

        if (isSuccess || isError) {
            const node = event.currentTarget || event.srcElement;

            // A serious error occurred
            if (!node) {
                return;
            }

            // Remove assigned events
            node.removeEventListener('load', this.onLoad, false);
            node.removeEventListener('error', this.onLoad, false);

            // Get the source file directly from the data-* attribute. Could use node.getAttribute('src') as well
            const sourceFile = node.getAttribute(DATA_ATTRIBUTE_SOURCE_FILE);

            // Update the state of the source file using the index position of the source file in sourceFiles
            const index = storageFiles.indexOf(sourceFile);
            if (index !== IS_NOT_FOUND) {
                storageState[index] = isSuccess;
            }

            if (isSuccess) {
                // Push to the successfully loaded scripts if loading was successful
                this.called.push(sourceFile);
            }

            this.onCompleted(isSuccess);
        }
    }
}

// Public API

// Create an instance of the internal loady class
const loady = new Loady();

// Load the source file(s)
export const load = (sourceFiles) => loady.load(sourceFiles);
