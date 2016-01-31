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
        global.user = mod.exports;
    }
})(this, function () {
    'use strict';

    (function (global) {
        var _publicAPI = {
            init: init
        };
        global.App = global.App || {};

        if (!global.App.user) {
            global.App.user = _publicAPI;
        }

        function init() {
            global.alert('Init: The following output was loaded directly from user.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
        }
    })(window);
});