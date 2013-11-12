'use strict';

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

    for (var i in data) { this[i] = data[i]; }
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
    var value = this;

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

    // Adjust for arguments
    if (arguments.length === 2) {
        path = arguments[0];
        data = arguments[1];
    } else {
        data = arguments[0];
    }

    // Handle path-referenced data change
    if (path) {
        addr   = path;
        addr   = addr.split('.');
        key    = addr.pop();
        target = this;

        for (var i=0, len=addr.length; i<len; i+=1) {
            target = target[addr[i]];
        }

        target[key] = data;
    }

    // Handle full data change
    else {
        for (var j in data) {
            this[j] = data[j];
        }
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
    var listeners = this.listeners;

    for (var i = listeners.length - 1; i >= 0; i -= 1) {
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

/****************
 *  Controller  *
 ****************/

/**
 * Creates an ascot-compatible controller interface for the model
 * @param {Function} callback A controller callback to associate with the model
 */
function createController(/* callbacks */) {
    var args = arguments;

    var controller = function(element, options) {
        this.addListener(function(model) {
            for (var i = 0, len = args.length; i < len; i += 1) {
                args[i](model, element, options);
            }
        });
    };

    return controller.bind(this);
}

/*****************
 *  Constructor  *
 *****************/

var Model = function(src, options) {
    options = options || {};

    Object.defineProperties(this, {
        'storeLocal' : {
            value        : options.storeLocal,
            writable     : true,
            enumerable   : false,
            configurable : false
        },
        'preferOnline' : {
            value        : options.preferOnline,
            writable     : true,
            enumerable   : false,
            configurable : false
        },
        'process' : {
            value        : options.process,
            writable     : true,
            enumerable   : false,
            configurable : false
        },
        'src' : {
            value        : src,
            writable     : true,
            enumerable   : false,
            configurable : false
        },
        'listeners' : {
            value        : [],
            writable     : true,
            enumerable   : false,
            configurable : false
        },
        'isLoaded' : {
            value        : false,
            writable     : true,
            enumerable   : false,
            configurable : false
        }
    });

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

Model.prototype = {
    store              : store,
    load               : load,
    set                : set,
    resolve            : resolve,
    addListener        : addListener,
    removeListener     : removeListener,
    removeAllListeners : removeAllListeners,
    createController   : createController
};

/*************
 *  Exports  *
 *************/

module.exports = Model;
