'use strict';

/******************
 *  Dependencies  *
 ******************/

var defineAPI = require('defineAPI');

/****************
 *  Properties  *
 ****************/

/**
 * @property {Boolean} preferOnline Whether to always attempt updating from the online location
 * rather than retrieve from localStorage
 */

/**
 * @property {Boolean} storeLocal Whether to store and retrieve this model from local storage
 */

/**
 * @property {Function} process A function used to process incoming data
 */

/**
 * @property {Boolean} isLoaded True if data has been loaded for this model
 */

/**********************************
 *  Loading, Storing, Retrieving  *
 **********************************/

/**
 * Stores the model to local storage.  Stored as a key/value pair where
 * the key is the src of the data and the value is a JSON string.
 */
function store(name) {
    name = name || this.src;

    localStorage[name] = JSON.stringify(this);
}

/**
 * Loads the data either from a server or from local storage depending on settings and
 * online status
 * @param {String} src Optionally specify the source of the data
 */
function load(src) {
    this.src = src || this.src;

    if (localStorage[src] && !this.preferOnline) {
        setTimeout(loadLocalData.bind(this), 0);
    } else {
        loadRemoteData.call(this);
    }
}

/**
 * Parses a json string and merges data with this model
 * @param {String} json
 */
function loadLocalData() {
    var localData = localStorage[this.src];

    if (localData) { parse.call(this, localData); }

    this.isLoaded = true;

    emit.call(this);
}

/**
 * Loads data from the server.  If the request fails, attempts loading data from localStorage.
 */
function loadRemoteData() {
    var src = this.src;
    var xhr = new XMLHttpRequest();

    xhr.open('GET', src);
    xhr.onreadystatechange = handleXHRResponse.bind(this, xhr);
    xhr.send(null);
}

/**
 * Parses passed json data
 * @param {String} json A valid JSON string
 */
function parse(json) {
    var data = JSON.parse(json);

    // Performs optional processing steps to modify the structure of the data
    if (this.process) { data = this.process(data); }

    this.data = data;
}

/**
 * Handles incoming XHR responses
 */
function handleXHRResponse(xhr) {
    var type, text;

    // Request was successful
    if (xhr.readyState === 4 && xhr.status === 200) {
        type = xhr.getResponseHeader('Content-Type');

        // Make sure response is JSON
        if (type.indexOf('json') >= 0) {
            text = xhr.responseText;

            // Parse and load
            parse.call(this, text);

            // Store data locally
            if (this.storeLocal) { this.store(); }

            this.isLoaded = true;

            emit.call(this);
        }

    // Request failed, attempt loading locally instead
    } else if (xhr.readyState === 4 && xhr.status !== 200) {
        loadLocalData.call(this);
    }
}

/**
 * Loads direct data that has been passed as a constructor on creating the model.
 * @param {Object} data Some data to associate with the model
 */
function loadDirectData(data) {
    set.call(this, data);
    emit.call(this);
}

/********************
 *  Data Accessors  *
 ********************/

/**
 * Resolves a path and returns relevant data
 * @param {String} path A period-delimited path to some data
 */
function resolve(path) {
    var value = this.data;

    path = path.split('.');

    for (var i=0, len=path.length; i<len; i+=1) {
        value = value[path[i]];
    }

    return value;
}

/**
 * Sets data on the model
 * @param {String}         path A path to a location within the data model
 * @param {Object|Variant} data The new data
 */
function set(/* arguments */) {
    var path, addr, data, target, key;
    var thisData = this.data;

    // Adjust for arguments
    if (arguments.length === 2) {
        path = arguments[0];
        data = arguments[1];
    } else {
        data = arguments[0];
    }

    // Handle index-referenced data change
    if (isFinite(path)) {
        this.data[path] = data;
    }

    // Handle path-referenced data change
    else if (path) {
        addr   = path;
        addr   = addr.split('.');
        key    = addr.pop();
        target = thisData;

        for (var i=0, len=addr.length; i<len; i+=1) {
            target = target[addr[i]];
        }

        target[key] = data;
    }

    // Handle full data change
    else {
        this.data = data;
    }

    emit.call(this);
}

/***********************
 *  Callback Handlers  *
 ***********************/

/**
 * Calls all callbacks registered to receive data change events
 */
function emit() {
    var listeners = this.listeners.slice(0);

    for (var i = 0, len = listeners.length; i < len; i += 1) {
        listeners[i](this);
    }
}

/**
 * Adds a new listener to the model
 * @param {Function} callback A function to call when a model's data has changed
 */
function addListener(callback) {
    var listeners = this.listeners;

    if (listeners.indexOf(callback) < 0) {
        listeners.push(callback);

        // Trigger callbacks if model has already been loaded
        if (this.isLoaded) {
            setTimeout(callback, 0, this);
        }
    }

    return this;
}

/**
 * Removes a listener from the model
 * @param {Function} callback A function to remove from the list of listeners
 */
function removeListener(callback) {
    var listeners = this.listeners;
    var index     = listeners.indexOf(callback);

    if (index >= 0) { listeners.splice(index, 1); }

    return this;
}

/**
 * Removes all listeners from the model
 */
function removeAllListeners() {
    this.listeners = [];
}

/*************
 *  Binding  *
 *************/

/**
 * Creates a model binding that may be applied as a controller to contexts
 * @param {Function} controller One or more element/model controllers
 */
function createController(/* controllers */) {
    var controllers = Array.prototype.slice.call(arguments, 0);

    function controller(element) {
        function listener(model) {
            for (var i = 0, len = controllers.length; i < len; i += 1) {
                controllers[i](element, model);
            }
        }

        this.addListener(listener);
    }

    return controller.bind(this);
}

/*****************
 *  Constructor  *
 *****************/

var Model = function(src, options) {
    options           = options || {};
    this.storeLocal   = options.storeLocal;
    this.preferOnline = options.preferOnline;
    this.process      = options.process;
    this.src          = src;
    this.listeners    = [];

    // Retrieve resource
    if (src) {
        if (typeof src === 'string') {
            load.call(this, src);
        }

        else if (src === Object(src)) {
            setTimeout(loadDirectData.bind(this, src), 0);
        }
    }
};

/***************
 *  Prototype  *
 ***************/

Model.prototype = defineAPI({
    storeLocal         : null,
    preferOnline       : null,
    process            : null,
    src                : null,
    isLoaded           : false,
    data               : null,
    listeners          : { val : null, wrt : true, enm : false, cfg : false },
    store              : store,
    load               : load,
    set                : set,
    resolve            : resolve,
    addListener        : addListener,
    removeListener     : removeListener,
    removeAllListeners : removeAllListeners,
    createController   : createController
});

/*************
 *  Exports  *
 *************/

module.exports = Model;
