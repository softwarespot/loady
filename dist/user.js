// IIFE - Immediately Invoked Function Expression (no global variables are leaked, apart from user of course)
'use strict';

(function (global) {
    function init() {
        global.alert('Init: The following output was loaded directly from user.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
    }

    // Public API
    var _publicAPI = {
        init: init
    };

    // Append 'user' to the global object reference and reference the public API
    if (!global.user) {
        global.user = _publicAPI;
    }

    return _publicAPI;
})(undefined);