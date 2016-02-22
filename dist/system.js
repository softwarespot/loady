(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports !== "undefined") {
        factory();
    } else {
        var mod = {
            exports: {}
        };
        factory();
        global.system = mod.exports;
    }
})(this, function () {
    'use strict';

    // IIFE - Immediately Invoked Function Expression (no global variables are leaked, apart from system of course)
    (function (global) {
        // Public API
        var _publicAPI = {
            init: init
        };

        // Create an 'App' namespace
        global.App = global.App || {};

        // Append 'system' to the global object reference and reference the public API
        if (!global.App.system) {
            global.App.system = _publicAPI;
        }

        function init() {
            global.alert('Init: The following output was loaded directly from system.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
        }
    })(window);
});