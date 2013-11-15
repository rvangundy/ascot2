'use strict';

/******************
 *  Dependencies  *
 ******************/

var Context = require('./Context');
var Model   = require('./Model');

/************************
 *  Context Handling  *
 ************************/

/**
 * Creates a new context object with the given element
 * @param {Element} element An HTML element
 */
function createContext(/* arguments */) {
    var ctx, div;
    var args = Array.prototype.slice.call(arguments, 0);
    var el   = args[0];

    // Instantiate appropriate HTML element for context
    if (typeof el === 'string') {
        div = document.createElement('div');
        div.innerHTML = args.shift();
        el = div.firstChild;
    } else if (el && el.tagName) {
        args.shift();
    }

    ctx = new Context(el);

    // Apply any controllers passed to createContext
    if (args.length) {
        ctx.use.apply(ctx, args);
    }

    return ctx;
}

/********************
 *  Model Handling  *
 ********************/

var MODELS = {};

/**
 * Creates or returns a model based on the passed url
 * @param {String} url The url pointing to the model's data resource
 */
function createModel(url) {
    if (MODELS[url]) { return MODELS[url]; }
    else {
        MODELS[url] = new Model(url);
        return MODELS[url];
    }
}

/*********
 *  API  *
 *********/

var ascot = createContext;

ascot.createContext = createContext;
ascot.createModel   = createModel;

/*************
 *  Exports  *
 *************/

module.exports = ascot;
