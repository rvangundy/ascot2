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
function createContext(element) {
    return new Context(element);
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

var ascot = {
    createContext : createContext,
    createModel   : createModel
};

/*************
 *  Exports  *
 *************/

module.exports = ascot;