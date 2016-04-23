// IIFE - Immediately Invoked Function Expression (no global variables are leaked, apart from user of course)
((global) => {
    // Public API
    const api = {
        init,
    };

    // Create an 'App' namespace
    global.App = global.App || {};

    // Append 'user' to the global object reference and reference the public API
    if (!global.App.user) {
        global.App.user = api;
    }

    function init() {
        global.alert('Init: The following output was loaded directly from user.js, but you will notice there is no script tag for loading this JavaScript file in the HTML source.');
    }
}(window));
