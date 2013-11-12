;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/***************
 *  Utilities  *
 ***************/

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function isObject(objectToCheck) {
    return objectToCheck === Object(objectToCheck);
}

function merge(objA, objB) {
    for (var i in objB) {
        objA[i] = objB[i];
    }

    return objA;
}

/*****************
 *  Composition  *
 *****************/

/**
 * Specifies the use of additional controllers by this context
 * @param {Function} controller A controller to use in this context
 * @param {Object} options An object representing various options to pass to controllers
 */
function use(/* arguments */) {
    var arg;
    var controllers = [];
    var options     = {};
    var element     = this.element = this.element || document.createDocumentFragment();

    // Collect controllers and merge options
    for (var i = 0, len = arguments.length; i < len; i += 1) {
        arg = arguments[i];
        if (isFunction(arg)) {
            // Asynchronously call the function
            controllers.push(arg);
        } else if (isObject(arg)) {
            merge(options, arg);
        }
    }

    // Call each controller, passing options in to each
    for (var j = 0, lenJ = controllers.length; j < lenJ; j += 1) {
        controllers[j](element, options);
    }

    return this;
}

/**
 * Adds a new innerHTML string to be used when building this context
 * @param {String}   innerHTML   A new HTML string to add to this context
 * @param {Function} controller  A controller to use in this context
 * @param {Object}   options     An object representing various options to pass to controllers
 */
function add(innerHTML) {
    var children;
    var element = this.element = this.element || document.createDocumentFragment();
    var args    = Array.prototype.slice.call(arguments, 1);
    var div     = document.createElement('div');

    div.innerHTML = innerHTML;
    children      = Array.prototype.slice.call(div.children, 0);

    // Add all children to the parent element
    for (var j = 0, lenJ = children.length; j < lenJ; j += 1) {
        element.appendChild(children[j]);
    }

    // Call 'use' on each added element
    for (var i = 0, len = children.length; i < len; i += 1) {
        use.apply({ element : children[i]}, args);
    }

    return this;
}

/**
 * Deploys the context's content on to the given target element
 * @param {Element} target A target element within which to insert new elements
 */
function appendTo(target) {
    target.appendChild(this.element);

    // Test if element is a fragment and set this context's element to be the target
    if (!this.element.tagName) {
        this.element = target;
    }

    return this;
}

/**
 * Deploys the context's content on to the given target element
 * @param {Element} target A target element within which to insert new elements
 */
function insertBefore(target) {
    var parent = target.parentNode;

    if (parent) { parent.insertBefore(this.element, target); }

    return this;
}

/**
 * Removes the context from the target element, adding it to a document fragment
 */
function remove() {
    var element = document.createDocumentFragment();

    element.appendChild(this.element);

    this.element = element;
}

/*******************
 *  DOM Selection  *
 *******************/

/**
 * Performs a querySelector on the current context
 * @param {String} selector A query selector string
 */
function select(selector) {
    return this.element.querySelector(selector);
}

/**
 * Performs a querySelectorAll on the current context
 * @param {String} selector A query selector string
 */
function selectAll(selector) {
    return this.element.querySelectorAll(selector);
}

/****************
 *  Attributes  *
 ****************/

/**
 * Returns the attribute value specified
 * @param {String} name The attribute name
 */
function getAttribute(name) {
    var element;

    // Determine which element to use based on whether it is a fragment or not
    if (!this.element.getAttribute) {
        element = this.element.childNodes[0];
    } else {
        element = this.element;
    }

    return element.getAttribute(name);
}

/*****************
 *  Constructor  *
 *****************/

var Context = function (element) {
    this.element = element || document.createDocumentFragment();
};

/***************
 *  Prototype  *
 ***************/

Context.prototype = {
    use          : use,
    add          : add,
    appendTo     : appendTo,
    insertBefore : insertBefore,
    remove       : remove,
    select       : select,
    selectAll    : selectAll,
    attr         : getAttribute
};

/*************
 *  Exports  *
 *************/

module.exports = Context;

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{"./Context":1,"./Model":2}],4:[function(require,module,exports){
'use strict';

var assert = chai.assert;
var sampleData = {
    'valA' : 7,
    'valB' : 13,
    'groupA' : {
        'valC' : 17,
        'valB' : 19
    }
};

/*******************************
 *  Basic Object Construction  *
 *******************************/

describe('Context', function() {
    var ascot = require('../scripts/ascot.js');
    var app   = ascot.createContext();

    app.use(function(el) {
        var ctx = ascot.createContext(el);

        ctx.add('<h1 class="testH1">Hello World!</h1>');
        ctx.add('<ul class="testUL"></ul>', function(el, options) {
            var ctx = ascot.createContext(el);

            ctx.add('<li>Hello</li><li>' + options.name + '</li>');
        }, { name : 'Ryan' });
    });

    app.appendTo(document.body);

    describe('use()', function() {

        it('should deploy to the document body', function() {
            assert.equal(app.element, document.body);
        });

        it('should add a new element to the DOM', function() {
            var h1 = document.body.querySelector('.testH1');

            assert.equal(h1.innerHTML, 'Hello World!');
        });

        it('should add a second new element to the DOM', function() {
            assert.ok(document.body.querySelector('.testUL'));
        });

        it ('should pass options in to a controller', function() {
            var list = document.body.querySelector('.testUL');

            assert.equal(list.children[1].innerHTML, 'Ryan');
        });
    });
});

describe('Model', function() {
    var ascot = require('../scripts/ascot.js');
    localStorage.clear();

    describe('Construction', function() {

        it('should load requested data', function(done) {
            var model = ascot.createModel('sample.json');

            model.addListener(function(data) {
                assert.ok(data);
                assert.equal(model.valA, sampleData.valA);
                model.removeAllListeners();
                done();
            });
        });

        it('should reload the same model if requested again', function(done) {
            var modelA = ascot.createModel('sample.json');
            var modelB = ascot.createModel('sample.json');

            assert.equal(modelA, modelB);

            modelB.addListener(function(data) {
                assert.equal(data.valA, sampleData.valA);
                done();
            });
        });
    });

    describe('createController()', function() {
        var ascot = require('../scripts/ascot.js');

        it('should create a valid controller that triggers a model update callback', function(done) {
            var modelA = ascot.createModel('sample.json');
            var app = ascot.createContext();
            var controller = modelA.createController(function(model, element) {
                assert.equal(model, modelA);
                assert.ok(element.classList.contains('controllerTest'));
                done();
            });

            app.use(function(element) {
                var ctx = ascot.createContext(element);

                ctx.add('<div class="controllerTest"></div>', controller);
            });
        });
    });
});

},{"../scripts/ascot.js":3}]},{},[4])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvcnlhbnZhbmd1bmR5L0RvY3VtZW50cy9hc2NvdDIvc2NyaXB0cy9Db250ZXh0LmpzIiwiL1VzZXJzL3J5YW52YW5ndW5keS9Eb2N1bWVudHMvYXNjb3QyL3NjcmlwdHMvTW9kZWwuanMiLCIvVXNlcnMvcnlhbnZhbmd1bmR5L0RvY3VtZW50cy9hc2NvdDIvc2NyaXB0cy9hc2NvdC5qcyIsIi9Vc2Vycy9yeWFudmFuZ3VuZHkvRG9jdW1lbnRzL2FzY290Mi90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuLyoqKioqKioqKioqKioqKlxuICogIFV0aWxpdGllcyAgKlxuICoqKioqKioqKioqKioqKi9cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jdGlvblRvQ2hlY2spIHtcbiAgICB2YXIgZ2V0VHlwZSA9IHt9O1xuICAgIHJldHVybiBmdW5jdGlvblRvQ2hlY2sgJiYgZ2V0VHlwZS50b1N0cmluZy5jYWxsKGZ1bmN0aW9uVG9DaGVjaykgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iamVjdFRvQ2hlY2spIHtcbiAgICByZXR1cm4gb2JqZWN0VG9DaGVjayA9PT0gT2JqZWN0KG9iamVjdFRvQ2hlY2spO1xufVxuXG5mdW5jdGlvbiBtZXJnZShvYmpBLCBvYmpCKSB7XG4gICAgZm9yICh2YXIgaSBpbiBvYmpCKSB7XG4gICAgICAgIG9iakFbaV0gPSBvYmpCW2ldO1xuICAgIH1cblxuICAgIHJldHVybiBvYmpBO1xufVxuXG4vKioqKioqKioqKioqKioqKipcbiAqICBDb21wb3NpdGlvbiAgKlxuICoqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFNwZWNpZmllcyB0aGUgdXNlIG9mIGFkZGl0aW9uYWwgY29udHJvbGxlcnMgYnkgdGhpcyBjb250ZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb250cm9sbGVyIEEgY29udHJvbGxlciB0byB1c2UgaW4gdGhpcyBjb250ZXh0XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBBbiBvYmplY3QgcmVwcmVzZW50aW5nIHZhcmlvdXMgb3B0aW9ucyB0byBwYXNzIHRvIGNvbnRyb2xsZXJzXG4gKi9cbmZ1bmN0aW9uIHVzZSgvKiBhcmd1bWVudHMgKi8pIHtcbiAgICB2YXIgYXJnO1xuICAgIHZhciBjb250cm9sbGVycyA9IFtdO1xuICAgIHZhciBvcHRpb25zICAgICA9IHt9O1xuICAgIHZhciBlbGVtZW50ICAgICA9IHRoaXMuZWxlbWVudCA9IHRoaXMuZWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICAvLyBDb2xsZWN0IGNvbnRyb2xsZXJzIGFuZCBtZXJnZSBvcHRpb25zXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBhcmcgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGlmIChpc0Z1bmN0aW9uKGFyZykpIHtcbiAgICAgICAgICAgIC8vIEFzeW5jaHJvbm91c2x5IGNhbGwgdGhlIGZ1bmN0aW9uXG4gICAgICAgICAgICBjb250cm9sbGVycy5wdXNoKGFyZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNPYmplY3QoYXJnKSkge1xuICAgICAgICAgICAgbWVyZ2Uob3B0aW9ucywgYXJnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENhbGwgZWFjaCBjb250cm9sbGVyLCBwYXNzaW5nIG9wdGlvbnMgaW4gdG8gZWFjaFxuICAgIGZvciAodmFyIGogPSAwLCBsZW5KID0gY29udHJvbGxlcnMubGVuZ3RoOyBqIDwgbGVuSjsgaiArPSAxKSB7XG4gICAgICAgIGNvbnRyb2xsZXJzW2pdKGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIEFkZHMgYSBuZXcgaW5uZXJIVE1MIHN0cmluZyB0byBiZSB1c2VkIHdoZW4gYnVpbGRpbmcgdGhpcyBjb250ZXh0XG4gKiBAcGFyYW0ge1N0cmluZ30gICBpbm5lckhUTUwgICBBIG5ldyBIVE1MIHN0cmluZyB0byBhZGQgdG8gdGhpcyBjb250ZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb250cm9sbGVyICBBIGNvbnRyb2xsZXIgdG8gdXNlIGluIHRoaXMgY29udGV4dFxuICogQHBhcmFtIHtPYmplY3R9ICAgb3B0aW9ucyAgICAgQW4gb2JqZWN0IHJlcHJlc2VudGluZyB2YXJpb3VzIG9wdGlvbnMgdG8gcGFzcyB0byBjb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiBhZGQoaW5uZXJIVE1MKSB7XG4gICAgdmFyIGNoaWxkcmVuO1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50ID0gdGhpcy5lbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICB2YXIgYXJncyAgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRpdiAgICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIGRpdi5pbm5lckhUTUwgPSBpbm5lckhUTUw7XG4gICAgY2hpbGRyZW4gICAgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRpdi5jaGlsZHJlbiwgMCk7XG5cbiAgICAvLyBBZGQgYWxsIGNoaWxkcmVuIHRvIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIGZvciAodmFyIGogPSAwLCBsZW5KID0gY2hpbGRyZW4ubGVuZ3RoOyBqIDwgbGVuSjsgaiArPSAxKSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGRyZW5bal0pO1xuICAgIH1cblxuICAgIC8vIENhbGwgJ3VzZScgb24gZWFjaCBhZGRlZCBlbGVtZW50XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIHVzZS5hcHBseSh7IGVsZW1lbnQgOiBjaGlsZHJlbltpXX0sIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIERlcGxveXMgdGhlIGNvbnRleHQncyBjb250ZW50IG9uIHRvIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudCB3aXRoaW4gd2hpY2ggdG8gaW5zZXJ0IG5ldyBlbGVtZW50c1xuICovXG5mdW5jdGlvbiBhcHBlbmRUbyh0YXJnZXQpIHtcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcblxuICAgIC8vIFRlc3QgaWYgZWxlbWVudCBpcyBhIGZyYWdtZW50IGFuZCBzZXQgdGhpcyBjb250ZXh0J3MgZWxlbWVudCB0byBiZSB0aGUgdGFyZ2V0XG4gICAgaWYgKCF0aGlzLmVsZW1lbnQudGFnTmFtZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSB0YXJnZXQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogRGVwbG95cyB0aGUgY29udGV4dCdzIGNvbnRlbnQgb24gdG8gdGhlIGdpdmVuIHRhcmdldCBlbGVtZW50XG4gKiBAcGFyYW0ge0VsZW1lbnR9IHRhcmdldCBBIHRhcmdldCBlbGVtZW50IHdpdGhpbiB3aGljaCB0byBpbnNlcnQgbmV3IGVsZW1lbnRzXG4gKi9cbmZ1bmN0aW9uIGluc2VydEJlZm9yZSh0YXJnZXQpIHtcbiAgICB2YXIgcGFyZW50ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG5cbiAgICBpZiAocGFyZW50KSB7IHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcy5lbGVtZW50LCB0YXJnZXQpOyB9XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBjb250ZXh0IGZyb20gdGhlIHRhcmdldCBlbGVtZW50LCBhZGRpbmcgaXQgdG8gYSBkb2N1bWVudCBmcmFnbWVudFxuICovXG5mdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xufVxuXG4vKioqKioqKioqKioqKioqKioqKlxuICogIERPTSBTZWxlY3Rpb24gICpcbiAqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgcXVlcnlTZWxlY3RvciBvbiB0aGUgY3VycmVudCBjb250ZXh0XG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgQSBxdWVyeSBzZWxlY3RvciBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc2VsZWN0KHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBhIHF1ZXJ5U2VsZWN0b3JBbGwgb24gdGhlIGN1cnJlbnQgY29udGV4dFxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIEEgcXVlcnkgc2VsZWN0b3Igc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHNlbGVjdEFsbChzZWxlY3Rvcikge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG59XG5cbi8qKioqKioqKioqKioqKioqXG4gKiAgQXR0cmlidXRlcyAgKlxuICoqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogUmV0dXJucyB0aGUgYXR0cmlidXRlIHZhbHVlIHNwZWNpZmllZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lXG4gKi9cbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZShuYW1lKSB7XG4gICAgdmFyIGVsZW1lbnQ7XG5cbiAgICAvLyBEZXRlcm1pbmUgd2hpY2ggZWxlbWVudCB0byB1c2UgYmFzZWQgb24gd2hldGhlciBpdCBpcyBhIGZyYWdtZW50IG9yIG5vdFxuICAgIGlmICghdGhpcy5lbGVtZW50LmdldEF0dHJpYnV0ZSkge1xuICAgICAgICBlbGVtZW50ID0gdGhpcy5lbGVtZW50LmNoaWxkTm9kZXNbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudCA9IHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUobmFtZSk7XG59XG5cbi8qKioqKioqKioqKioqKioqKlxuICogIENvbnN0cnVjdG9yICAqXG4gKioqKioqKioqKioqKioqKiovXG5cbnZhciBDb250ZXh0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50IHx8IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbn07XG5cbi8qKioqKioqKioqKioqKipcbiAqICBQcm90b3R5cGUgICpcbiAqKioqKioqKioqKioqKiovXG5cbkNvbnRleHQucHJvdG90eXBlID0ge1xuICAgIHVzZSAgICAgICAgICA6IHVzZSxcbiAgICBhZGQgICAgICAgICAgOiBhZGQsXG4gICAgYXBwZW5kVG8gICAgIDogYXBwZW5kVG8sXG4gICAgaW5zZXJ0QmVmb3JlIDogaW5zZXJ0QmVmb3JlLFxuICAgIHJlbW92ZSAgICAgICA6IHJlbW92ZSxcbiAgICBzZWxlY3QgICAgICAgOiBzZWxlY3QsXG4gICAgc2VsZWN0QWxsICAgIDogc2VsZWN0QWxsLFxuICAgIGF0dHIgICAgICAgICA6IGdldEF0dHJpYnV0ZVxufTtcblxuLyoqKioqKioqKioqKipcbiAqICBFeHBvcnRzICAqXG4gKioqKioqKioqKioqKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKioqKioqKioqKioqKioqKlxuICogIFByb3BlcnRpZXMgICpcbiAqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gcHJlZmVyT25saW5lIFdoZXRoZXIgdG8gYWx3YXlzIGF0dGVtcHQgdXBkYXRpbmcgZnJvbSB0aGUgb25saW5lIGxvY2F0aW9uIFxuICogcmF0aGVyIHRoYW4gcmV0cmlldmUgZnJvbSBsb2NhbFN0b3JhZ2VcbiAqL1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc3RvcmVMb2NhbCBXaGV0aGVyIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSB0aGlzIG1vZGVsIGZyb20gbG9jYWwgc3RvcmFnZVxuICovXG5cbi8qKlxuICogQHByb3BlcnR5IHtGdW5jdGlvbn0gcHJvY2VzcyBBIGZ1bmN0aW9uIHVzZWQgdG8gcHJvY2VzcyBpbmNvbWluZyBkYXRhXG4gKi9cblxuLyoqXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IGlzTG9hZGVkIFRydWUgaWYgZGF0YSBoYXMgYmVlbiBsb2FkZWQgZm9yIHRoaXMgbW9kZWxcbiAqL1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIExvYWRpbmcsIFN0b3JpbmcsIFJldHJpZXZpbmcgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgbW9kZWwgdG8gbG9jYWwgc3RvcmFnZS4gIFN0b3JlZCBhcyBhIGtleS92YWx1ZSBwYWlyIHdoZXJlXG4gKiB0aGUga2V5IGlzIHRoZSBzcmMgb2YgdGhlIGRhdGEgYW5kIHRoZSB2YWx1ZSBpcyBhIEpTT04gc3RyaW5nLlxuICovXG5mdW5jdGlvbiBzdG9yZShuYW1lKSB7XG4gICAgbmFtZSA9IG5hbWUgfHwgdGhpcy5zcmM7XG5cbiAgICBsb2NhbFN0b3JhZ2VbbmFtZV0gPSBKU09OLnN0cmluZ2lmeSh0aGlzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyB0aGUgZGF0YSBlaXRoZXIgZnJvbSBhIHNlcnZlciBvciBmcm9tIGxvY2FsIHN0b3JhZ2UgZGVwZW5kaW5nIG9uIHNldHRpbmdzIGFuZFxuICogb25saW5lIHN0YXR1c1xuICogQHBhcmFtIHtTdHJpbmd9IHNyYyBPcHRpb25hbGx5IHNwZWNpZnkgdGhlIHNvdXJjZSBvZiB0aGUgZGF0YVxuICovXG5mdW5jdGlvbiBsb2FkKHNyYykge1xuICAgIHRoaXMuc3JjID0gc3JjIHx8IHRoaXMuc3JjO1xuXG4gICAgaWYgKGxvY2FsU3RvcmFnZVtzcmNdICYmICF0aGlzLnByZWZlck9ubGluZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGxvYWRMb2NhbERhdGEuYmluZCh0aGlzKSwgMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9hZFJlbW90ZURhdGEuY2FsbCh0aGlzKTtcbiAgICB9XG59XG5cbi8qKlxuICogUGFyc2VzIGEganNvbiBzdHJpbmcgYW5kIG1lcmdlcyBkYXRhIHdpdGggdGhpcyBtb2RlbFxuICogQHBhcmFtIHtTdHJpbmd9IGpzb25cbiAqL1xuZnVuY3Rpb24gbG9hZExvY2FsRGF0YSgpIHtcbiAgICB2YXIgbG9jYWxEYXRhID0gbG9jYWxTdG9yYWdlW3RoaXMuc3JjXTtcblxuICAgIGlmIChsb2NhbERhdGEpIHsgcGFyc2UuY2FsbCh0aGlzLCBsb2NhbERhdGEpOyB9XG5cbiAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcblxuICAgIGVtaXQuY2FsbCh0aGlzKTtcbn1cblxuLyoqXG4gKiBMb2FkcyBkYXRhIGZyb20gdGhlIHNlcnZlci4gIElmIHRoZSByZXF1ZXN0IGZhaWxzLCBhdHRlbXB0cyBsb2FkaW5nIGRhdGEgZnJvbSBsb2NhbFN0b3JhZ2UuXG4gKi9cbmZ1bmN0aW9uIGxvYWRSZW1vdGVEYXRhKCkge1xuICAgIHZhciBzcmMgPSB0aGlzLnNyYztcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignR0VUJywgc3JjKTtcbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlWEhSUmVzcG9uc2UuYmluZCh0aGlzLCB4aHIpO1xuICAgIHhoci5zZW5kKG51bGwpO1xufVxuXG4vKipcbiAqIFBhcnNlcyBwYXNzZWQganNvbiBkYXRhXG4gKiBAcGFyYW0ge1N0cmluZ30ganNvbiBBIHZhbGlkIEpTT04gc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHBhcnNlKGpzb24pIHtcbiAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoanNvbik7XG5cbiAgICAvLyBQZXJmb3JtcyBvcHRpb25hbCBwcm9jZXNzaW5nIHN0ZXBzIHRvIG1vZGlmeSB0aGUgc3RydWN0dXJlIG9mIHRoZSBkYXRhXG4gICAgaWYgKHRoaXMucHJvY2VzcykgeyBkYXRhID0gdGhpcy5wcm9jZXNzKGRhdGEpOyB9XG5cbiAgICBmb3IgKHZhciBpIGluIGRhdGEpIHsgdGhpc1tpXSA9IGRhdGFbaV07IH1cbn1cblxuLyoqXG4gKiBIYW5kbGVzIGluY29taW5nIFhIUiByZXNwb25zZXNcbiAqL1xuZnVuY3Rpb24gaGFuZGxlWEhSUmVzcG9uc2UoeGhyKSB7XG4gICAgdmFyIHR5cGUsIHRleHQ7XG5cbiAgICAvLyBSZXF1ZXN0IHdhcyBzdWNjZXNzZnVsXG4gICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmIHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICB0eXBlID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKTtcblxuICAgICAgICAvLyBNYWtlIHN1cmUgcmVzcG9uc2UgaXMgSlNPTlxuICAgICAgICBpZiAodHlwZS5pbmRleE9mKCdqc29uJykgPj0gMCkge1xuICAgICAgICAgICAgdGV4dCA9IHhoci5yZXNwb25zZVRleHQ7XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIGFuZCBsb2FkXG4gICAgICAgICAgICBwYXJzZS5jYWxsKHRoaXMsIHRleHQpO1xuXG4gICAgICAgICAgICAvLyBTdG9yZSBkYXRhIGxvY2FsbHlcbiAgICAgICAgICAgIGlmICh0aGlzLnN0b3JlTG9jYWwpIHsgdGhpcy5zdG9yZSgpOyB9XG5cbiAgICAgICAgICAgIHRoaXMuaXNMb2FkZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBlbWl0LmNhbGwodGhpcyk7XG4gICAgICAgIH1cblxuICAgIC8vIFJlcXVlc3QgZmFpbGVkLCBhdHRlbXB0IGxvYWRpbmcgbG9jYWxseSBpbnN0ZWFkXG4gICAgfSBlbHNlIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCAmJiB4aHIuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgbG9hZExvY2FsRGF0YS5jYWxsKHRoaXMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBMb2FkcyBkaXJlY3QgZGF0YSB0aGF0IGhhcyBiZWVuIHBhc3NlZCBhcyBhIGNvbnN0cnVjdG9yIG9uIGNyZWF0aW5nIHRoZSBtb2RlbC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIFNvbWUgZGF0YSB0byBhc3NvY2lhdGUgd2l0aCB0aGUgbW9kZWxcbiAqL1xuZnVuY3Rpb24gbG9hZERpcmVjdERhdGEoZGF0YSkge1xuICAgIHNldC5jYWxsKHRoaXMsIGRhdGEpO1xuICAgIGVtaXQuY2FsbCh0aGlzKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqXG4gKiAgRGF0YSBBY2Nlc3NvcnMgICpcbiAqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBSZXNvbHZlcyBhIHBhdGggYW5kIHJldHVybnMgcmVsZXZhbnQgZGF0YVxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggQSBwZXJpb2QtZGVsaW1pdGVkIHBhdGggdG8gc29tZSBkYXRhXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmUocGF0aCkge1xuICAgIHZhciB2YWx1ZSA9IHRoaXM7XG5cbiAgICBwYXRoID0gcGF0aC5zcGxpdCgnLicpO1xuXG4gICAgZm9yICh2YXIgaT0wLCBsZW49cGF0aC5sZW5ndGg7IGk8bGVuOyBpKz0xKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWVbcGF0aFtpXV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFNldHMgZGF0YSBvbiB0aGUgbW9kZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSAgICAgICAgIHBhdGggQSBwYXRoIHRvIGEgbG9jYXRpb24gd2l0aGluIHRoZSBkYXRhIG1vZGVsXG4gKiBAcGFyYW0ge09iamVjdHxWYXJpYW50fSBkYXRhIFRoZSBuZXcgZGF0YVxuICovXG5mdW5jdGlvbiBzZXQoLyogYXJndW1lbnRzICovKSB7XG4gICAgdmFyIHBhdGgsIGFkZHIsIGRhdGEsIHRhcmdldCwga2V5O1xuXG4gICAgLy8gQWRqdXN0IGZvciBhcmd1bWVudHNcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICBwYXRoID0gYXJndW1lbnRzWzBdO1xuICAgICAgICBkYXRhID0gYXJndW1lbnRzWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMF07XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIHBhdGgtcmVmZXJlbmNlZCBkYXRhIGNoYW5nZVxuICAgIGlmIChwYXRoKSB7XG4gICAgICAgIGFkZHIgICA9IHBhdGg7XG4gICAgICAgIGFkZHIgICA9IGFkZHIuc3BsaXQoJy4nKTtcbiAgICAgICAga2V5ICAgID0gYWRkci5wb3AoKTtcbiAgICAgICAgdGFyZ2V0ID0gdGhpcztcblxuICAgICAgICBmb3IgKHZhciBpPTAsIGxlbj1hZGRyLmxlbmd0aDsgaTxsZW47IGkrPTEpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldFthZGRyW2ldXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFtrZXldID0gZGF0YTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgZnVsbCBkYXRhIGNoYW5nZVxuICAgIGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBqIGluIGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXNbal0gPSBkYXRhW2pdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW1pdC5jYWxsKHRoaXMpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBDYWxsYmFjayBIYW5kbGVycyAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIENhbGxzIGFsbCBjYWxsYmFja3MgcmVnaXN0ZXJlZCB0byByZWNlaXZlIGRhdGEgY2hhbmdlIGV2ZW50c1xuICovXG5mdW5jdGlvbiBlbWl0KCkge1xuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycztcblxuICAgIGZvciAodmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpIC09IDEpIHtcbiAgICAgICAgbGlzdGVuZXJzW2ldKHRoaXMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBZGRzIGEgbmV3IGxpc3RlbmVyIHRvIHRoZSBtb2RlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gYSBtb2RlbCdzIGRhdGEgaGFzIGNoYW5nZWRcbiAqL1xuZnVuY3Rpb24gYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnM7XG5cbiAgICBpZiAobGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spIDwgMCkge1xuICAgICAgICBsaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBjYWxsYmFja3MgaWYgbW9kZWwgaGFzIGFscmVhZHkgYmVlbiBsb2FkZWRcbiAgICAgICAgaWYgKHRoaXMuaXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoY2FsbGJhY2ssIDAsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZyb20gdGhlIG1vZGVsXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBBIGZ1bmN0aW9uIHRvIHJlbW92ZSBmcm9tIHRoZSBsaXN0IG9mIGxpc3RlbmVyc1xuICovXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycztcbiAgICB2YXIgaW5kZXggICAgID0gbGlzdGVuZXJzLmluZGV4T2YoY2FsbGJhY2spO1xuXG4gICAgaWYgKGluZGV4ID49IDApIHsgbGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7IH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIHRoZSBtb2RlbFxuICovXG5mdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbn1cblxuLyoqKioqKioqKioqKioqKipcbiAqICBDb250cm9sbGVyICAqXG4gKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGFzY290LWNvbXBhdGlibGUgY29udHJvbGxlciBpbnRlcmZhY2UgZm9yIHRoZSBtb2RlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBjb250cm9sbGVyIGNhbGxiYWNrIHRvIGFzc29jaWF0ZSB3aXRoIHRoZSBtb2RlbFxuICovXG5mdW5jdGlvbiBjcmVhdGVDb250cm9sbGVyKC8qIGNhbGxiYWNrcyAqLykge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuXG4gICAgdmFyIGNvbnRyb2xsZXIgPSBmdW5jdGlvbihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXIoZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcmdzLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tpXShtb2RlbCwgZWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gY29udHJvbGxlci5iaW5kKHRoaXMpO1xufVxuXG4vKioqKioqKioqKioqKioqKipcbiAqICBDb25zdHJ1Y3RvciAgKlxuICoqKioqKioqKioqKioqKioqL1xuXG52YXIgTW9kZWwgPSBmdW5jdGlvbihzcmMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgJ3N0b3JlTG9jYWwnIDoge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogb3B0aW9ucy5zdG9yZUxvY2FsLFxuICAgICAgICAgICAgd3JpdGFibGUgICAgIDogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGUgICA6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlIDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgJ3ByZWZlck9ubGluZScgOiB7XG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgOiBvcHRpb25zLnByZWZlck9ubGluZSxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdwcm9jZXNzJyA6IHtcbiAgICAgICAgICAgIHZhbHVlICAgICAgICA6IG9wdGlvbnMucHJvY2VzcyxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdzcmMnIDoge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogc3JjLFxuICAgICAgICAgICAgd3JpdGFibGUgICAgIDogdHJ1ZSxcbiAgICAgICAgICAgIGVudW1lcmFibGUgICA6IGZhbHNlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlIDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgJ2xpc3RlbmVycycgOiB7XG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgOiBbXSxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdpc0xvYWRlZCcgOiB7XG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgOiBmYWxzZSxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChzcmMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzcmMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsb2FkLmNhbGwodGhpcywgc3JjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKHNyYyA9PT0gT2JqZWN0KHNyYykpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQobG9hZERpcmVjdERhdGEuYmluZCh0aGlzLCBzcmMpLCAwKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKioqKioqKioqKioqKipcbiAqICBQcm90b3R5cGUgICpcbiAqKioqKioqKioqKioqKiovXG5cbk1vZGVsLnByb3RvdHlwZSA9IHtcbiAgICBzdG9yZSAgICAgICAgICAgICAgOiBzdG9yZSxcbiAgICBsb2FkICAgICAgICAgICAgICAgOiBsb2FkLFxuICAgIHNldCAgICAgICAgICAgICAgICA6IHNldCxcbiAgICByZXNvbHZlICAgICAgICAgICAgOiByZXNvbHZlLFxuICAgIGFkZExpc3RlbmVyICAgICAgICA6IGFkZExpc3RlbmVyLFxuICAgIHJlbW92ZUxpc3RlbmVyICAgICA6IHJlbW92ZUxpc3RlbmVyLFxuICAgIHJlbW92ZUFsbExpc3RlbmVycyA6IHJlbW92ZUFsbExpc3RlbmVycyxcbiAgICBjcmVhdGVDb250cm9sbGVyICAgOiBjcmVhdGVDb250cm9sbGVyXG59O1xuXG4vKioqKioqKioqKioqKlxuICogIEV4cG9ydHMgICpcbiAqKioqKioqKioqKioqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKioqKioqKioqKioqKioqKioqXG4gKiAgRGVwZW5kZW5jaWVzICAqXG4gKioqKioqKioqKioqKioqKioqL1xuXG52YXIgQ29udGV4dCA9IHJlcXVpcmUoJy4vQ29udGV4dCcpO1xudmFyIE1vZGVsICAgPSByZXF1aXJlKCcuL01vZGVsJyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBDb250ZXh0IEhhbmRsaW5nICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgY29udGV4dCBvYmplY3Qgd2l0aCB0aGUgZ2l2ZW4gZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IEFuIEhUTUwgZWxlbWVudFxuICovXG5mdW5jdGlvbiBjcmVhdGVDb250ZXh0KGVsZW1lbnQpIHtcblx0cmV0dXJuIG5ldyBDb250ZXh0KGVsZW1lbnQpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKipcbiAqICBNb2RlbCBIYW5kbGluZyAgKlxuICoqKioqKioqKioqKioqKioqKioqL1xuXG52YXIgTU9ERUxTID0ge307XG5cbi8qKlxuICogQ3JlYXRlcyBvciByZXR1cm5zIGEgbW9kZWwgYmFzZWQgb24gdGhlIHBhc3NlZCB1cmxcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgVGhlIHVybCBwb2ludGluZyB0byB0aGUgbW9kZWwncyBkYXRhIHJlc291cmNlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU1vZGVsKHVybCkge1xuXHRpZiAoTU9ERUxTW3VybF0pIHsgcmV0dXJuIE1PREVMU1t1cmxdOyB9XG5cdGVsc2Uge1xuXHRcdE1PREVMU1t1cmxdID0gbmV3IE1vZGVsKHVybCk7XG5cdFx0cmV0dXJuIE1PREVMU1t1cmxdO1xuXHR9XG59XG5cbi8qKioqKioqKipcbiAqICBBUEkgICpcbiAqKioqKioqKiovXG5cbnZhciBhc2NvdCA9IHtcblx0Y3JlYXRlQ29udGV4dCA6IGNyZWF0ZUNvbnRleHQsXG5cdGNyZWF0ZU1vZGVsICAgOiBjcmVhdGVNb2RlbFxufTtcblxuLyoqKioqKioqKioqKipcbiAqICBFeHBvcnRzICAqXG4gKioqKioqKioqKioqKi9cblxubW9kdWxlLmV4cG9ydHMgPSBhc2NvdDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBhc3NlcnQgPSBjaGFpLmFzc2VydDtcbnZhciBzYW1wbGVEYXRhID0ge1xuICAgICd2YWxBJyA6IDcsXG4gICAgJ3ZhbEInIDogMTMsXG4gICAgJ2dyb3VwQScgOiB7XG4gICAgICAgICd2YWxDJyA6IDE3LFxuICAgICAgICAndmFsQicgOiAxOVxuICAgIH1cbn07XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgQmFzaWMgT2JqZWN0IENvbnN0cnVjdGlvbiAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmRlc2NyaWJlKCdDb250ZXh0JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFzY290ID0gcmVxdWlyZSgnLi4vc2NyaXB0cy9hc2NvdC5qcycpO1xuICAgIHZhciBhcHAgICA9IGFzY290LmNyZWF0ZUNvbnRleHQoKTtcblxuICAgIGFwcC51c2UoZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgdmFyIGN0eCA9IGFzY290LmNyZWF0ZUNvbnRleHQoZWwpO1xuXG4gICAgICAgIGN0eC5hZGQoJzxoMSBjbGFzcz1cInRlc3RIMVwiPkhlbGxvIFdvcmxkITwvaDE+Jyk7XG4gICAgICAgIGN0eC5hZGQoJzx1bCBjbGFzcz1cInRlc3RVTFwiPjwvdWw+JywgZnVuY3Rpb24oZWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjdHggPSBhc2NvdC5jcmVhdGVDb250ZXh0KGVsKTtcblxuICAgICAgICAgICAgY3R4LmFkZCgnPGxpPkhlbGxvPC9saT48bGk+JyArIG9wdGlvbnMubmFtZSArICc8L2xpPicpO1xuICAgICAgICB9LCB7IG5hbWUgOiAnUnlhbicgfSk7XG4gICAgfSk7XG5cbiAgICBhcHAuYXBwZW5kVG8oZG9jdW1lbnQuYm9keSk7XG5cbiAgICBkZXNjcmliZSgndXNlKCknLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpdCgnc2hvdWxkIGRlcGxveSB0byB0aGUgZG9jdW1lbnQgYm9keScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFwcC5lbGVtZW50LCBkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBhZGQgYSBuZXcgZWxlbWVudCB0byB0aGUgRE9NJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaDEgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJy50ZXN0SDEnKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGgxLmlubmVySFRNTCwgJ0hlbGxvIFdvcmxkIScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGFkZCBhIHNlY29uZCBuZXcgZWxlbWVudCB0byB0aGUgRE9NJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhc3NlcnQub2soZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcudGVzdFVMJykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCAoJ3Nob3VsZCBwYXNzIG9wdGlvbnMgaW4gdG8gYSBjb250cm9sbGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbGlzdCA9IGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignLnRlc3RVTCcpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobGlzdC5jaGlsZHJlblsxXS5pbm5lckhUTUwsICdSeWFuJyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdNb2RlbCcsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhc2NvdCA9IHJlcXVpcmUoJy4uL3NjcmlwdHMvYXNjb3QuanMnKTtcbiAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcblxuICAgIGRlc2NyaWJlKCdDb25zdHJ1Y3Rpb24nLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpdCgnc2hvdWxkIGxvYWQgcmVxdWVzdGVkIGRhdGEnLCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWwgPSBhc2NvdC5jcmVhdGVNb2RlbCgnc2FtcGxlLmpzb24nKTtcblxuICAgICAgICAgICAgbW9kZWwuYWRkTGlzdGVuZXIoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhkYXRhKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwobW9kZWwudmFsQSwgc2FtcGxlRGF0YS52YWxBKTtcbiAgICAgICAgICAgICAgICBtb2RlbC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCByZWxvYWQgdGhlIHNhbWUgbW9kZWwgaWYgcmVxdWVzdGVkIGFnYWluJywgZnVuY3Rpb24oZG9uZSkge1xuICAgICAgICAgICAgdmFyIG1vZGVsQSA9IGFzY290LmNyZWF0ZU1vZGVsKCdzYW1wbGUuanNvbicpO1xuICAgICAgICAgICAgdmFyIG1vZGVsQiA9IGFzY290LmNyZWF0ZU1vZGVsKCdzYW1wbGUuanNvbicpO1xuXG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwobW9kZWxBLCBtb2RlbEIpO1xuXG4gICAgICAgICAgICBtb2RlbEIuYWRkTGlzdGVuZXIoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChkYXRhLnZhbEEsIHNhbXBsZURhdGEudmFsQSk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2NyZWF0ZUNvbnRyb2xsZXIoKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXNjb3QgPSByZXF1aXJlKCcuLi9zY3JpcHRzL2FzY290LmpzJyk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBjcmVhdGUgYSB2YWxpZCBjb250cm9sbGVyIHRoYXQgdHJpZ2dlcnMgYSBtb2RlbCB1cGRhdGUgY2FsbGJhY2snLCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWxBID0gYXNjb3QuY3JlYXRlTW9kZWwoJ3NhbXBsZS5qc29uJyk7XG4gICAgICAgICAgICB2YXIgYXBwID0gYXNjb3QuY3JlYXRlQ29udGV4dCgpO1xuICAgICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBtb2RlbEEuY3JlYXRlQ29udHJvbGxlcihmdW5jdGlvbihtb2RlbCwgZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChtb2RlbCwgbW9kZWxBKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2soZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbnRyb2xsZXJUZXN0JykpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBhcHAudXNlKGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3R4ID0gYXNjb3QuY3JlYXRlQ29udGV4dChlbGVtZW50KTtcblxuICAgICAgICAgICAgICAgIGN0eC5hZGQoJzxkaXYgY2xhc3M9XCJjb250cm9sbGVyVGVzdFwiPjwvZGl2PicsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG4iXX0=
;