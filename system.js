// IIFE - Immediately Invoked Function Expression (no global variables are leaked, apart from system of course)
((global) => {
    function init() {
        global.alert('Init: The following output was loaded directly from system.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
    }

    // Public API
    const _publicAPI = {
        init: init
    };

    // Create an 'App' namespace
    global.App = global.App || {};

    // Append 'system' to the global object reference and reference the public API
    if (!global.App.system) {
        global.App.system = _publicAPI;
    }

    return _publicAPI;
})(window); // Can't be 'this' with babelJS, as it gets set to 'undefined'
