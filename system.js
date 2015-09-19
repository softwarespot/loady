// IIFE - Immediately Invoked Function Expression (no global variables are leaked, apart from system of course)
((global) => {
    function init() {
        global.alert('Init: The following output was loaded directly from system.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
    }

    // Public API
    let _publicAPI = {
        init: init
    };

    // Append 'system' to the global object reference and reference the public API
    if (!global.system) {
        global.system = _publicAPI;
    }

    return _publicAPI;
})(this);
