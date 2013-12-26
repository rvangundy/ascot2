'use strict';

/***************
 *  Polyfills  *
 ***************/

Array.isArray = Array.isArray || (Array.isArray = function(a){
    return '' + a !== a && {}.toString.call(a) === '[object Array]';
});

/******************
 *  Dependencies  *
 ******************/

var Context = require('./Context');

/************************
 *  Context Handling  *
 ************************/

/**
 * Creates a new context object with the given element
 * @param {Element} element An HTML element
 */
function createContext(/* arguments */) {
    var div;
    var args = Array.prototype.slice.call(arguments, 0);
    var el   = args[0];
    var ctx  = Context.getByElement(el);

    // Use an existing context
    if (ctx) { args.shift(); }

    // Create a new context
    else {
        // Instantiate appropriate HTML element for context
        if (typeof el === 'string') {
            div = document.createElement('div');
            div.innerHTML = args.shift();
            el = div.firstChild;

        // Use the passed element
        } else if (el && el.tagName) {
            args.shift();
        }

        // Create a new context without an element
        else { el = null; }

        ctx = new Context(el);
    }

    // Apply any controllers passed to createContext
    if (args.length) {
        ctx.use.apply(ctx, args);
    }

    return ctx;
}

/*********
 *  API  *
 *********/

var ascot = createContext;

ascot.createContext = createContext;

/*************
 *  Exports  *
 *************/

module.exports = ascot;
