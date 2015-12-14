'use strict';

function _instanceof(left, right) { if (right != null && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports);
        global.loady = mod.exports;
    }
})(this, function (exports) {
    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) {
        if (!_instanceof(instance, Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = (function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    })();

    var VERSION = '0.1.0';
    var DATA_ATTRIBUTE_SOURCE_FILE = 'data-loady-sourcefile';
    var IS_NOT_FOUND = -1;
    var _document = window.document;

    var _head = _document.head || _document.getElementsByTagName('head')[0];

    var _reJSExtension = /(?:\.js$)/;
    var _storageFiles = [];
    var _storageState = [];
    var _objectStringsArray = '[object Array]';
    var _objectStringsFunction = '[object Function]';
    var _objectStringsGenerator = '[object GeneratorFunction]';
    var _objectStringsString = '[object String]';
    var _objectToString = window.Object.prototype.toString;

    function _isFunction(value) {
        var tag = _objectToString.call(value);

        return tag === _objectStringsFunction || tag === _objectStringsGenerator;
    }

    var _isArray = _isFunction(window.Array.isArray) ? window.Array.isArray : function (value) {
        return _objectToString.call(value) === _objectStringsArray;
    };

    function _isString(value) {
        return typeof value === 'string' || _objectToString.call(value) === _objectStringsString;
    }

    var Loady = (function () {
        function Loady() {
            _classCallCheck(this, Loady);

            this._destroy();
        }

        _createClass(Loady, [{
            key: 'getVersion',
            value: function getVersion() {
                return VERSION;
            }
        }, {
            key: 'load',
            value: function load(sourceFiles) {
                var _this = this;

                if (!_isArray(sourceFiles)) {
                    sourceFiles = [sourceFiles];
                }

                sourceFiles = sourceFiles.filter(function (sourceFile) {
                    return _isString(sourceFile) && sourceFile.length > 0;
                });

                this._destroy();

                var promise = new window.Promise(function (resolve, reject) {
                    _this._resolve = resolve;
                    _this._reject = reject;
                });

                if (sourceFiles.length === 0) {
                    this._isSuccess = false;

                    this._onCompleted();

                    return promise;
                }

                this._allLoaded = 0;
                this._called = [];
                this._initiallyLoaded = sourceFiles.length;
                sourceFiles.map(function (sourceFile) {
                    return sourceFile.replace(_reJSExtension, '') + '.js';
                }).filter(function (sourceFile) {
                    var index = _storageFiles.indexOf(sourceFile);

                    var isNotFound = index === IS_NOT_FOUND;

                    if (!isNotFound) {
                        _this._onCompleted(_storageState[index]);
                    }

                    return isNotFound;
                }).forEach(function (sourceFile) {
                    _this._loadScript(sourceFile);
                });
                return promise;
            }
        }, {
            key: '_destroy',
            value: function _destroy() {
                this._allLoaded = -1;
                this._called = null;
                this._initiallyLoaded = 0;
                this._isSuccess = true;
                this._resolve = null;
                this._reject = null;
            }
        }, {
            key: '_loadScript',
            value: function _loadScript(sourceFile) {
                var node = _document.createElement('script');

                node.src = sourceFile;
                node.async = true;
                node.setAttribute(DATA_ATTRIBUTE_SOURCE_FILE, sourceFile);
                node.addEventListener('load', this._onLoad.bind(this), false);
                node.addEventListener('error', this._onLoad.bind(this), false);

                _head.appendChild(node);

                _storageFiles.push(sourceFile);
            }
        }, {
            key: '_onCompleted',
            value: function _onCompleted() {
                this._allLoaded++;

                if (this._initiallyLoaded === this._allLoaded) {
                    if (this._isSuccess) {
                        this._resolve(this._called);
                    } else {
                        this._reject(this._called);
                    }

                    this._destroy();
                }
            }
        }, {
            key: '_onLoad',
            value: function _onLoad(event) {
                var type = event.type;
                var isError = type === 'error';
                var isSuccess = type === 'load';

                if (!isSuccess && this._isSuccess) {
                    this._isSuccess = isSuccess;
                }

                if (isSuccess || isError) {
                    var node = event.currentTarget || event.srcElement;

                    if (!node) {
                        return;
                    }

                    node.removeEventListener('load', this._onLoad, false);
                    node.removeEventListener('error', this._onLoad, false);
                    var sourceFile = node.getAttribute(DATA_ATTRIBUTE_SOURCE_FILE);

                    var index = _storageFiles.indexOf(sourceFile);

                    if (index !== IS_NOT_FOUND) {
                        _storageState[index] = isSuccess;
                    }

                    if (isSuccess) {
                        this._called.push(sourceFile);
                    }

                    this._onCompleted(isSuccess);
                }
            }
        }]);

        return Loady;
    })();

    var loady = new Loady();

    var load = exports.load = function load(sourceFiles) {
        loady.load(sourceFiles);
    };
});