;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

if (typeof window.Element === "undefined" || "classList" in document.documentElement) return;

// adds indexOf to Array prototype for IE support
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}

var prototype = Array.prototype,
    indexOf = prototype.indexOf,
    slice = prototype.slice,
    push = prototype.push,
    splice = prototype.splice,
    join = prototype.join;

function DOMTokenList(el) {  
  this._element = el;
  if (el.className != this._classCache) {
    this._classCache = el.className;

    if (!this._classCache) return;
    
      // The className needs to be trimmed and split on whitespace
      // to retrieve a list of classes.
      var classes = this._classCache.replace(/^\s+|\s+$/g,'').split(/\s+/),
        i;
    for (i = 0; i < classes.length; i++) {
      push.call(this, classes[i]);
    }
  }
};

function setToClassName(el, classes) {
  el.className = classes.join(' ');
}

DOMTokenList.prototype = {
  add: function(token) {
    if(this.contains(token)) return;
    push.call(this, token);
    setToClassName(this._element, slice.call(this, 0));
  },
  contains: function(token) {
    return indexOf.call(this, token) !== -1;
  },
  item: function(index) {
    return this[index] || null;
  },
  remove: function(token) {
    var i = indexOf.call(this, token);
     if (i === -1) {
       return;
     }
    splice.call(this, i, 1);
    setToClassName(this._element, slice.call(this, 0));
  },
  toString: function() {
    return join.call(this, ' ');
  },
  toggle: function(token) {
    if (!this.contains(token)) {
      this.add(token);
    } else {
      this.remove(token);
    }

    return this.contains(token);
  }
};

window.DOMTokenList = DOMTokenList;

function defineElementGetter (obj, prop, getter) {
	if (Object.defineProperty) {
		Object.defineProperty(obj, prop,{
			get : getter
		})
	} else {					
		obj.__defineGetter__(prop, getter);
	}
}

defineElementGetter(Element.prototype, 'classList', function () {
  return new DOMTokenList(this);			
});

})();

},{}],2:[function(require,module,exports){
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
    var fragment = document.createDocumentFragment();

    fragment.appendChild(this.element);
}

/**
 * Merges the HTML string content with the current context
 * @param {String} innerHTML Some new HTML to merge with the current context
 */
function mergeElements(innerHTML) {
    var newElement, attributes, attr, classList, children;
    var element = this.element;
    var div     = document.createElement('div');

    // Handle fragments
    if (!element.tagName) {
        div.innerHTML = innerHTML;
        element.appendChild(div.firstChild);
        return;
    }

    // Merge elements
    div.innerHTML = innerHTML;
    if (div.children.length === 1) {
        newElement = div.firstChild;
        attributes = Array.prototype.slice.call(newElement.attributes, 0);

        // Merge all data-* attributes
        for (var i = 0, len = attributes.length; i < len; i += 1) {
            attr = attributes[i];
            if (attr.name.indexOf('data') >= 0) {
                element.setAttribute(attr.name, attr.value);
            }
        }

        // Merge class lists
        classList = newElement.classList;
        for (var j = 0, lenJ = classList.length; j < lenJ; j += 1) {
            element.classList.add(classList[j]);
        }

        // Merge child nodes
        children = Array.prototype.slice.call(newElement.childNodes, 0);
        for (var k = 0, lenK = children.length; k < lenK; k += 1) {
            element.appendChild(children[k]);
        }
    }

    return this;
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
    attr         : getAttribute,
    merge        : mergeElements
};

/*************
 *  Exports  *
 *************/

module.exports = Context;

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
'use strict';

/******************
 *  Dependencies  *
 ******************/

var Context = require('./Context');
var Model   = require('./Model');

// classList polyfill still necessary for some targets
require('../bower_components/html5-polyfills/classList');

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
},{"../bower_components/html5-polyfills/classList":1,"./Context":2,"./Model":3}],5:[function(require,module,exports){
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

        ctx.add('<div class="top"></div>', function(el) {
            var ctx = ascot.createContext(el);

            ctx.add('<h1 class="testH1">Hello World!</h1>');
            ctx.add('<ul class="testUL"></ul>', function(el, options) {
                var ctx = ascot.createContext(el);

                ctx.add('<li>Hello</li><li>' + options.name + '</li>');
            }, { name : 'Ryan' });
        });
    });

    app.appendTo(document.body);

    describe('use() & add()', function() {

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

        it('should pass options in to a controller', function() {
            var list = document.body.querySelector('.testUL');

            assert.equal(list.children[1].innerHTML, 'Ryan');
        });

    });

    describe('remove()', function() {
        it('should remove itself from its parent', function() {
            ascot.createContext(document.body.querySelector('.top')).remove();
            assert.notOk(document.body.querySelector('.top'));
        });
    });

    describe('merge()', function() {
        var el = document.createElement('div');
        var ctx = ascot.createContext(el);

        el.classList.add('testA');

        ctx.merge('<div class="testB" data-test="5"><span>ChildA</span><span>ChildB</span></div>');

        it('should merge class lists', function() {
            assert.ok(el.classList.contains('testA'));
            assert.ok(el.classList.contains('testB'));
        });

        it('should merge data-* attributes', function() {
            assert.equal(el.getAttribute('data-test'), 5);
        });

        it('should merge child elements', function() {
            assert.equal(el.children.length, 2);
            assert.equal(el.children[0].innerHTML, 'ChildA');
            assert.equal(el.children[1].innerHTML, 'ChildB');
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

},{"../scripts/ascot.js":4}]},{},[5])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvcnlhbnZhbmd1bmR5L0RvY3VtZW50cy9hc2NvdDIvYm93ZXJfY29tcG9uZW50cy9odG1sNS1wb2x5ZmlsbHMvY2xhc3NMaXN0LmpzIiwiL1VzZXJzL3J5YW52YW5ndW5keS9Eb2N1bWVudHMvYXNjb3QyL3NjcmlwdHMvQ29udGV4dC5qcyIsIi9Vc2Vycy9yeWFudmFuZ3VuZHkvRG9jdW1lbnRzL2FzY290Mi9zY3JpcHRzL01vZGVsLmpzIiwiL1VzZXJzL3J5YW52YW5ndW5keS9Eb2N1bWVudHMvYXNjb3QyL3NjcmlwdHMvYXNjb3QuanMiLCIvVXNlcnMvcnlhbnZhbmd1bmR5L0RvY3VtZW50cy9hc2NvdDIvdGVzdC90ZXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcblxuaWYgKHR5cGVvZiB3aW5kb3cuRWxlbWVudCA9PT0gXCJ1bmRlZmluZWRcIiB8fCBcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkgcmV0dXJuO1xuXG4vLyBhZGRzIGluZGV4T2YgdG8gQXJyYXkgcHJvdG90eXBlIGZvciBJRSBzdXBwb3J0XG5pZiAoIUFycmF5LnByb3RvdHlwZS5pbmRleE9mKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihvYmosIHN0YXJ0KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAoc3RhcnQgfHwgMCksIGogPSB0aGlzLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IG9iaikgeyByZXR1cm4gaTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG59XG5cbnZhciBwcm90b3R5cGUgPSBBcnJheS5wcm90b3R5cGUsXG4gICAgaW5kZXhPZiA9IHByb3RvdHlwZS5pbmRleE9mLFxuICAgIHNsaWNlID0gcHJvdG90eXBlLnNsaWNlLFxuICAgIHB1c2ggPSBwcm90b3R5cGUucHVzaCxcbiAgICBzcGxpY2UgPSBwcm90b3R5cGUuc3BsaWNlLFxuICAgIGpvaW4gPSBwcm90b3R5cGUuam9pbjtcblxuZnVuY3Rpb24gRE9NVG9rZW5MaXN0KGVsKSB7ICBcbiAgdGhpcy5fZWxlbWVudCA9IGVsO1xuICBpZiAoZWwuY2xhc3NOYW1lICE9IHRoaXMuX2NsYXNzQ2FjaGUpIHtcbiAgICB0aGlzLl9jbGFzc0NhY2hlID0gZWwuY2xhc3NOYW1lO1xuXG4gICAgaWYgKCF0aGlzLl9jbGFzc0NhY2hlKSByZXR1cm47XG4gICAgXG4gICAgICAvLyBUaGUgY2xhc3NOYW1lIG5lZWRzIHRvIGJlIHRyaW1tZWQgYW5kIHNwbGl0IG9uIHdoaXRlc3BhY2VcbiAgICAgIC8vIHRvIHJldHJpZXZlIGEgbGlzdCBvZiBjbGFzc2VzLlxuICAgICAgdmFyIGNsYXNzZXMgPSB0aGlzLl9jbGFzc0NhY2hlLnJlcGxhY2UoL15cXHMrfFxccyskL2csJycpLnNwbGl0KC9cXHMrLyksXG4gICAgICAgIGk7XG4gICAgZm9yIChpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHB1c2guY2FsbCh0aGlzLCBjbGFzc2VzW2ldKTtcbiAgICB9XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNldFRvQ2xhc3NOYW1lKGVsLCBjbGFzc2VzKSB7XG4gIGVsLmNsYXNzTmFtZSA9IGNsYXNzZXMuam9pbignICcpO1xufVxuXG5ET01Ub2tlbkxpc3QucHJvdG90eXBlID0ge1xuICBhZGQ6IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgaWYodGhpcy5jb250YWlucyh0b2tlbikpIHJldHVybjtcbiAgICBwdXNoLmNhbGwodGhpcywgdG9rZW4pO1xuICAgIHNldFRvQ2xhc3NOYW1lKHRoaXMuX2VsZW1lbnQsIHNsaWNlLmNhbGwodGhpcywgMCkpO1xuICB9LFxuICBjb250YWluczogZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gaW5kZXhPZi5jYWxsKHRoaXMsIHRva2VuKSAhPT0gLTE7XG4gIH0sXG4gIGl0ZW06IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXNbaW5kZXhdIHx8IG51bGw7XG4gIH0sXG4gIHJlbW92ZTogZnVuY3Rpb24odG9rZW4pIHtcbiAgICB2YXIgaSA9IGluZGV4T2YuY2FsbCh0aGlzLCB0b2tlbik7XG4gICAgIGlmIChpID09PSAtMSkge1xuICAgICAgIHJldHVybjtcbiAgICAgfVxuICAgIHNwbGljZS5jYWxsKHRoaXMsIGksIDEpO1xuICAgIHNldFRvQ2xhc3NOYW1lKHRoaXMuX2VsZW1lbnQsIHNsaWNlLmNhbGwodGhpcywgMCkpO1xuICB9LFxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGpvaW4uY2FsbCh0aGlzLCAnICcpO1xuICB9LFxuICB0b2dnbGU6IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5zKHRva2VuKSkge1xuICAgICAgdGhpcy5hZGQodG9rZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbW92ZSh0b2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY29udGFpbnModG9rZW4pO1xuICB9XG59O1xuXG53aW5kb3cuRE9NVG9rZW5MaXN0ID0gRE9NVG9rZW5MaXN0O1xuXG5mdW5jdGlvbiBkZWZpbmVFbGVtZW50R2V0dGVyIChvYmosIHByb3AsIGdldHRlcikge1xuXHRpZiAoT2JqZWN0LmRlZmluZVByb3BlcnR5KSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcCx7XG5cdFx0XHRnZXQgOiBnZXR0ZXJcblx0XHR9KVxuXHR9IGVsc2Uge1x0XHRcdFx0XHRcblx0XHRvYmouX19kZWZpbmVHZXR0ZXJfXyhwcm9wLCBnZXR0ZXIpO1xuXHR9XG59XG5cbmRlZmluZUVsZW1lbnRHZXR0ZXIoRWxlbWVudC5wcm90b3R5cGUsICdjbGFzc0xpc3QnLCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBuZXcgRE9NVG9rZW5MaXN0KHRoaXMpO1x0XHRcdFxufSk7XG5cbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKioqKioqKioqKioqKipcbiAqICBVdGlsaXRpZXMgICpcbiAqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oZnVuY3Rpb25Ub0NoZWNrKSB7XG4gICAgdmFyIGdldFR5cGUgPSB7fTtcbiAgICByZXR1cm4gZnVuY3Rpb25Ub0NoZWNrICYmIGdldFR5cGUudG9TdHJpbmcuY2FsbChmdW5jdGlvblRvQ2hlY2spID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChvYmplY3RUb0NoZWNrKSB7XG4gICAgcmV0dXJuIG9iamVjdFRvQ2hlY2sgPT09IE9iamVjdChvYmplY3RUb0NoZWNrKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2Uob2JqQSwgb2JqQikge1xuICAgIGZvciAodmFyIGkgaW4gb2JqQikge1xuICAgICAgICBvYmpBW2ldID0gb2JqQltpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqQTtcbn1cblxuLyoqKioqKioqKioqKioqKioqXG4gKiAgQ29tcG9zaXRpb24gICpcbiAqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBTcGVjaWZpZXMgdGhlIHVzZSBvZiBhZGRpdGlvbmFsIGNvbnRyb2xsZXJzIGJ5IHRoaXMgY29udGV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29udHJvbGxlciBBIGNvbnRyb2xsZXIgdG8gdXNlIGluIHRoaXMgY29udGV4dFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgQW4gb2JqZWN0IHJlcHJlc2VudGluZyB2YXJpb3VzIG9wdGlvbnMgdG8gcGFzcyB0byBjb250cm9sbGVyc1xuICovXG5mdW5jdGlvbiB1c2UoLyogYXJndW1lbnRzICovKSB7XG4gICAgdmFyIGFyZztcbiAgICB2YXIgY29udHJvbGxlcnMgPSBbXTtcbiAgICB2YXIgb3B0aW9ucyAgICAgPSB7fTtcbiAgICB2YXIgZWxlbWVudCAgICAgPSB0aGlzLmVsZW1lbnQgPSB0aGlzLmVsZW1lbnQgfHwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgLy8gQ29sbGVjdCBjb250cm9sbGVycyBhbmQgbWVyZ2Ugb3B0aW9uc1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihhcmcpKSB7XG4gICAgICAgICAgICAvLyBBc3luY2hyb25vdXNseSBjYWxsIHRoZSBmdW5jdGlvblxuICAgICAgICAgICAgY29udHJvbGxlcnMucHVzaChhcmcpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGFyZykpIHtcbiAgICAgICAgICAgIG1lcmdlKG9wdGlvbnMsIGFyZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDYWxsIGVhY2ggY29udHJvbGxlciwgcGFzc2luZyBvcHRpb25zIGluIHRvIGVhY2hcbiAgICBmb3IgKHZhciBqID0gMCwgbGVuSiA9IGNvbnRyb2xsZXJzLmxlbmd0aDsgaiA8IGxlbko7IGogKz0gMSkge1xuICAgICAgICBjb250cm9sbGVyc1tqXShlbGVtZW50LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBBZGRzIGEgbmV3IGlubmVySFRNTCBzdHJpbmcgdG8gYmUgdXNlZCB3aGVuIGJ1aWxkaW5nIHRoaXMgY29udGV4dFxuICogQHBhcmFtIHtTdHJpbmd9ICAgaW5uZXJIVE1MICAgQSBuZXcgSFRNTCBzdHJpbmcgdG8gYWRkIHRvIHRoaXMgY29udGV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29udHJvbGxlciAgQSBjb250cm9sbGVyIHRvIHVzZSBpbiB0aGlzIGNvbnRleHRcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIG9wdGlvbnMgICAgIEFuIG9iamVjdCByZXByZXNlbnRpbmcgdmFyaW91cyBvcHRpb25zIHRvIHBhc3MgdG8gY29udHJvbGxlcnNcbiAqL1xuZnVuY3Rpb24gYWRkKGlubmVySFRNTCkge1xuICAgIHZhciBjaGlsZHJlbjtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMuZWxlbWVudCA9IHRoaXMuZWxlbWVudCB8fCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdmFyIGFyZ3MgICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkaXYgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBkaXYuaW5uZXJIVE1MID0gaW5uZXJIVE1MO1xuICAgIGNoaWxkcmVuICAgICAgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkaXYuY2hpbGRyZW4sIDApO1xuXG4gICAgLy8gQWRkIGFsbCBjaGlsZHJlbiB0byB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBmb3IgKHZhciBqID0gMCwgbGVuSiA9IGNoaWxkcmVuLmxlbmd0aDsgaiA8IGxlbko7IGogKz0gMSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkcmVuW2pdKTtcbiAgICB9XG5cbiAgICAvLyBDYWxsICd1c2UnIG9uIGVhY2ggYWRkZWQgZWxlbWVudFxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICB1c2UuYXBwbHkoeyBlbGVtZW50IDogY2hpbGRyZW5baV19LCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBEZXBsb3lzIHRoZSBjb250ZXh0J3MgY29udGVudCBvbiB0byB0aGUgZ2l2ZW4gdGFyZ2V0IGVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0IEEgdGFyZ2V0IGVsZW1lbnQgd2l0aGluIHdoaWNoIHRvIGluc2VydCBuZXcgZWxlbWVudHNcbiAqL1xuZnVuY3Rpb24gYXBwZW5kVG8odGFyZ2V0KSB7XG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cbiAgICAvLyBUZXN0IGlmIGVsZW1lbnQgaXMgYSBmcmFnbWVudCBhbmQgc2V0IHRoaXMgY29udGV4dCdzIGVsZW1lbnQgdG8gYmUgdGhlIHRhcmdldFxuICAgIGlmICghdGhpcy5lbGVtZW50LnRhZ05hbWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gdGFyZ2V0O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIERlcGxveXMgdGhlIGNvbnRleHQncyBjb250ZW50IG9uIHRvIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudFxuICogQHBhcmFtIHtFbGVtZW50fSB0YXJnZXQgQSB0YXJnZXQgZWxlbWVudCB3aXRoaW4gd2hpY2ggdG8gaW5zZXJ0IG5ldyBlbGVtZW50c1xuICovXG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUodGFyZ2V0KSB7XG4gICAgdmFyIHBhcmVudCA9IHRhcmdldC5wYXJlbnROb2RlO1xuXG4gICAgaWYgKHBhcmVudCkgeyBwYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMuZWxlbWVudCwgdGFyZ2V0KTsgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgY29udGV4dCBmcm9tIHRoZSB0YXJnZXQgZWxlbWVudCwgYWRkaW5nIGl0IHRvIGEgZG9jdW1lbnQgZnJhZ21lbnRcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG59XG5cbi8qKlxuICogTWVyZ2VzIHRoZSBIVE1MIHN0cmluZyBjb250ZW50IHdpdGggdGhlIGN1cnJlbnQgY29udGV4dFxuICogQHBhcmFtIHtTdHJpbmd9IGlubmVySFRNTCBTb21lIG5ldyBIVE1MIHRvIG1lcmdlIHdpdGggdGhlIGN1cnJlbnQgY29udGV4dFxuICovXG5mdW5jdGlvbiBtZXJnZUVsZW1lbnRzKGlubmVySFRNTCkge1xuICAgIHZhciBuZXdFbGVtZW50LCBhdHRyaWJ1dGVzLCBhdHRyLCBjbGFzc0xpc3QsIGNoaWxkcmVuO1xuICAgIHZhciBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgIHZhciBkaXYgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAvLyBIYW5kbGUgZnJhZ21lbnRzXG4gICAgaWYgKCFlbGVtZW50LnRhZ05hbWUpIHtcbiAgICAgICAgZGl2LmlubmVySFRNTCA9IGlubmVySFRNTDtcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZChkaXYuZmlyc3RDaGlsZCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBNZXJnZSBlbGVtZW50c1xuICAgIGRpdi5pbm5lckhUTUwgPSBpbm5lckhUTUw7XG4gICAgaWYgKGRpdi5jaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgbmV3RWxlbWVudCA9IGRpdi5maXJzdENoaWxkO1xuICAgICAgICBhdHRyaWJ1dGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobmV3RWxlbWVudC5hdHRyaWJ1dGVzLCAwKTtcblxuICAgICAgICAvLyBNZXJnZSBhbGwgZGF0YS0qIGF0dHJpYnV0ZXNcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGF0dHJpYnV0ZXMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGF0dHIgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgICAgICAgaWYgKGF0dHIubmFtZS5pbmRleE9mKCdkYXRhJykgPj0gMCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKGF0dHIubmFtZSwgYXR0ci52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNZXJnZSBjbGFzcyBsaXN0c1xuICAgICAgICBjbGFzc0xpc3QgPSBuZXdFbGVtZW50LmNsYXNzTGlzdDtcbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbkogPSBjbGFzc0xpc3QubGVuZ3RoOyBqIDwgbGVuSjsgaiArPSAxKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NMaXN0W2pdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1lcmdlIGNoaWxkIG5vZGVzXG4gICAgICAgIGNoaWxkcmVuID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobmV3RWxlbWVudC5jaGlsZE5vZGVzLCAwKTtcbiAgICAgICAgZm9yICh2YXIgayA9IDAsIGxlbksgPSBjaGlsZHJlbi5sZW5ndGg7IGsgPCBsZW5LOyBrICs9IDEpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGRyZW5ba10pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqXG4gKiAgRE9NIFNlbGVjdGlvbiAgKlxuICoqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogUGVyZm9ybXMgYSBxdWVyeVNlbGVjdG9yIG9uIHRoZSBjdXJyZW50IGNvbnRleHRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBBIHF1ZXJ5IHNlbGVjdG9yIHN0cmluZ1xuICovXG5mdW5jdGlvbiBzZWxlY3Qoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xufVxuXG4vKipcbiAqIFBlcmZvcm1zIGEgcXVlcnlTZWxlY3RvckFsbCBvbiB0aGUgY3VycmVudCBjb250ZXh0XG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgQSBxdWVyeSBzZWxlY3RvciBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc2VsZWN0QWxsKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbn1cblxuLyoqKioqKioqKioqKioqKipcbiAqICBBdHRyaWJ1dGVzICAqXG4gKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhdHRyaWJ1dGUgdmFsdWUgc3BlY2lmaWVkXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlIG5hbWVcbiAqL1xuZnVuY3Rpb24gZ2V0QXR0cmlidXRlKG5hbWUpIHtcbiAgICB2YXIgZWxlbWVudDtcblxuICAgIC8vIERldGVybWluZSB3aGljaCBlbGVtZW50IHRvIHVzZSBiYXNlZCBvbiB3aGV0aGVyIGl0IGlzIGEgZnJhZ21lbnQgb3Igbm90XG4gICAgaWYgKCF0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKSB7XG4gICAgICAgIGVsZW1lbnQgPSB0aGlzLmVsZW1lbnQuY2hpbGROb2Rlc1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50ID0gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShuYW1lKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqXG4gKiAgQ29uc3RydWN0b3IgICpcbiAqKioqKioqKioqKioqKioqKi9cblxudmFyIENvbnRleHQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQgfHwgZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xufTtcblxuLyoqKioqKioqKioqKioqKlxuICogIFByb3RvdHlwZSAgKlxuICoqKioqKioqKioqKioqKi9cblxuQ29udGV4dC5wcm90b3R5cGUgPSB7XG4gICAgdXNlICAgICAgICAgIDogdXNlLFxuICAgIGFkZCAgICAgICAgICA6IGFkZCxcbiAgICBhcHBlbmRUbyAgICAgOiBhcHBlbmRUbyxcbiAgICBpbnNlcnRCZWZvcmUgOiBpbnNlcnRCZWZvcmUsXG4gICAgcmVtb3ZlICAgICAgIDogcmVtb3ZlLFxuICAgIHNlbGVjdCAgICAgICA6IHNlbGVjdCxcbiAgICBzZWxlY3RBbGwgICAgOiBzZWxlY3RBbGwsXG4gICAgYXR0ciAgICAgICAgIDogZ2V0QXR0cmlidXRlLFxuICAgIG1lcmdlICAgICAgICA6IG1lcmdlRWxlbWVudHNcbn07XG5cbi8qKioqKioqKioqKioqXG4gKiAgRXhwb3J0cyAgKlxuICoqKioqKioqKioqKiovXG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGV4dDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqKioqKioqKioqKioqKipcbiAqICBQcm9wZXJ0aWVzICAqXG4gKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHByZWZlck9ubGluZSBXaGV0aGVyIHRvIGFsd2F5cyBhdHRlbXB0IHVwZGF0aW5nIGZyb20gdGhlIG9ubGluZSBsb2NhdGlvbiBcbiAqIHJhdGhlciB0aGFuIHJldHJpZXZlIGZyb20gbG9jYWxTdG9yYWdlXG4gKi9cblxuLyoqXG4gKiBAcHJvcGVydHkge0Jvb2xlYW59IHN0b3JlTG9jYWwgV2hldGhlciB0byBzdG9yZSBhbmQgcmV0cmlldmUgdGhpcyBtb2RlbCBmcm9tIGxvY2FsIHN0b3JhZ2VcbiAqL1xuXG4vKipcbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IHByb2Nlc3MgQSBmdW5jdGlvbiB1c2VkIHRvIHByb2Nlc3MgaW5jb21pbmcgZGF0YVxuICovXG5cbi8qKlxuICogQHByb3BlcnR5IHtCb29sZWFufSBpc0xvYWRlZCBUcnVlIGlmIGRhdGEgaGFzIGJlZW4gbG9hZGVkIGZvciB0aGlzIG1vZGVsXG4gKi9cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqICBMb2FkaW5nLCBTdG9yaW5nLCBSZXRyaWV2aW5nICAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBTdG9yZXMgdGhlIG1vZGVsIHRvIGxvY2FsIHN0b3JhZ2UuICBTdG9yZWQgYXMgYSBrZXkvdmFsdWUgcGFpciB3aGVyZVxuICogdGhlIGtleSBpcyB0aGUgc3JjIG9mIHRoZSBkYXRhIGFuZCB0aGUgdmFsdWUgaXMgYSBKU09OIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gc3RvcmUobmFtZSkge1xuICAgIG5hbWUgPSBuYW1lIHx8IHRoaXMuc3JjO1xuXG4gICAgbG9jYWxTdG9yYWdlW25hbWVdID0gSlNPTi5zdHJpbmdpZnkodGhpcyk7XG59XG5cbi8qKlxuICogTG9hZHMgdGhlIGRhdGEgZWl0aGVyIGZyb20gYSBzZXJ2ZXIgb3IgZnJvbSBsb2NhbCBzdG9yYWdlIGRlcGVuZGluZyBvbiBzZXR0aW5ncyBhbmRcbiAqIG9ubGluZSBzdGF0dXNcbiAqIEBwYXJhbSB7U3RyaW5nfSBzcmMgT3B0aW9uYWxseSBzcGVjaWZ5IHRoZSBzb3VyY2Ugb2YgdGhlIGRhdGFcbiAqL1xuZnVuY3Rpb24gbG9hZChzcmMpIHtcbiAgICB0aGlzLnNyYyA9IHNyYyB8fCB0aGlzLnNyYztcblxuICAgIGlmIChsb2NhbFN0b3JhZ2Vbc3JjXSAmJiAhdGhpcy5wcmVmZXJPbmxpbmUpIHtcbiAgICAgICAgc2V0VGltZW91dChsb2FkTG9jYWxEYXRhLmJpbmQodGhpcyksIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxvYWRSZW1vdGVEYXRhLmNhbGwodGhpcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIFBhcnNlcyBhIGpzb24gc3RyaW5nIGFuZCBtZXJnZXMgZGF0YSB3aXRoIHRoaXMgbW9kZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBqc29uXG4gKi9cbmZ1bmN0aW9uIGxvYWRMb2NhbERhdGEoKSB7XG4gICAgdmFyIGxvY2FsRGF0YSA9IGxvY2FsU3RvcmFnZVt0aGlzLnNyY107XG5cbiAgICBpZiAobG9jYWxEYXRhKSB7IHBhcnNlLmNhbGwodGhpcywgbG9jYWxEYXRhKTsgfVxuXG4gICAgdGhpcy5pc0xvYWRlZCA9IHRydWU7XG5cbiAgICBlbWl0LmNhbGwodGhpcyk7XG59XG5cbi8qKlxuICogTG9hZHMgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuICBJZiB0aGUgcmVxdWVzdCBmYWlscywgYXR0ZW1wdHMgbG9hZGluZyBkYXRhIGZyb20gbG9jYWxTdG9yYWdlLlxuICovXG5mdW5jdGlvbiBsb2FkUmVtb3RlRGF0YSgpIHtcbiAgICB2YXIgc3JjID0gdGhpcy5zcmM7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHNyYyk7XG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGhhbmRsZVhIUlJlc3BvbnNlLmJpbmQodGhpcywgeGhyKTtcbiAgICB4aHIuc2VuZChudWxsKTtcbn1cblxuLyoqXG4gKiBQYXJzZXMgcGFzc2VkIGpzb24gZGF0YVxuICogQHBhcmFtIHtTdHJpbmd9IGpzb24gQSB2YWxpZCBKU09OIHN0cmluZ1xuICovXG5mdW5jdGlvbiBwYXJzZShqc29uKSB7XG4gICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGpzb24pO1xuXG4gICAgLy8gUGVyZm9ybXMgb3B0aW9uYWwgcHJvY2Vzc2luZyBzdGVwcyB0byBtb2RpZnkgdGhlIHN0cnVjdHVyZSBvZiB0aGUgZGF0YVxuICAgIGlmICh0aGlzLnByb2Nlc3MpIHsgZGF0YSA9IHRoaXMucHJvY2VzcyhkYXRhKTsgfVxuXG4gICAgZm9yICh2YXIgaSBpbiBkYXRhKSB7IHRoaXNbaV0gPSBkYXRhW2ldOyB9XG59XG5cbi8qKlxuICogSGFuZGxlcyBpbmNvbWluZyBYSFIgcmVzcG9uc2VzXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZVhIUlJlc3BvbnNlKHhocikge1xuICAgIHZhciB0eXBlLCB0ZXh0O1xuXG4gICAgLy8gUmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bFxuICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCAmJiB4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgdHlwZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1UeXBlJyk7XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHJlc3BvbnNlIGlzIEpTT05cbiAgICAgICAgaWYgKHR5cGUuaW5kZXhPZignanNvbicpID49IDApIHtcbiAgICAgICAgICAgIHRleHQgPSB4aHIucmVzcG9uc2VUZXh0O1xuXG4gICAgICAgICAgICAvLyBQYXJzZSBhbmQgbG9hZFxuICAgICAgICAgICAgcGFyc2UuY2FsbCh0aGlzLCB0ZXh0KTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgZGF0YSBsb2NhbGx5XG4gICAgICAgICAgICBpZiAodGhpcy5zdG9yZUxvY2FsKSB7IHRoaXMuc3RvcmUoKTsgfVxuXG4gICAgICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgZW1pdC5jYWxsKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAvLyBSZXF1ZXN0IGZhaWxlZCwgYXR0ZW1wdCBsb2FkaW5nIGxvY2FsbHkgaW5zdGVhZFxuICAgIH0gZWxzZSBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQgJiYgeGhyLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGxvYWRMb2NhbERhdGEuY2FsbCh0aGlzKTtcbiAgICB9XG59XG5cbi8qKlxuICogTG9hZHMgZGlyZWN0IGRhdGEgdGhhdCBoYXMgYmVlbiBwYXNzZWQgYXMgYSBjb25zdHJ1Y3RvciBvbiBjcmVhdGluZyB0aGUgbW9kZWwuXG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YSBTb21lIGRhdGEgdG8gYXNzb2NpYXRlIHdpdGggdGhlIG1vZGVsXG4gKi9cbmZ1bmN0aW9uIGxvYWREaXJlY3REYXRhKGRhdGEpIHtcbiAgICBzZXQuY2FsbCh0aGlzLCBkYXRhKTtcbiAgICBlbWl0LmNhbGwodGhpcyk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKlxuICogIERhdGEgQWNjZXNzb3JzICAqXG4gKioqKioqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogUmVzb2x2ZXMgYSBwYXRoIGFuZCByZXR1cm5zIHJlbGV2YW50IGRhdGFcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIEEgcGVyaW9kLWRlbGltaXRlZCBwYXRoIHRvIHNvbWUgZGF0YVxuICovXG5mdW5jdGlvbiByZXNvbHZlKHBhdGgpIHtcbiAgICB2YXIgdmFsdWUgPSB0aGlzO1xuXG4gICAgcGF0aCA9IHBhdGguc3BsaXQoJy4nKTtcblxuICAgIGZvciAodmFyIGk9MCwgbGVuPXBhdGgubGVuZ3RoOyBpPGxlbjsgaSs9MSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlW3BhdGhbaV1dO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBTZXRzIGRhdGEgb24gdGhlIG1vZGVsXG4gKiBAcGFyYW0ge1N0cmluZ30gICAgICAgICBwYXRoIEEgcGF0aCB0byBhIGxvY2F0aW9uIHdpdGhpbiB0aGUgZGF0YSBtb2RlbFxuICogQHBhcmFtIHtPYmplY3R8VmFyaWFudH0gZGF0YSBUaGUgbmV3IGRhdGFcbiAqL1xuZnVuY3Rpb24gc2V0KC8qIGFyZ3VtZW50cyAqLykge1xuICAgIHZhciBwYXRoLCBhZGRyLCBkYXRhLCB0YXJnZXQsIGtleTtcblxuICAgIC8vIEFkanVzdCBmb3IgYXJndW1lbnRzXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgcGF0aCA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgZGF0YSA9IGFyZ3VtZW50c1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhID0gYXJndW1lbnRzWzBdO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBwYXRoLXJlZmVyZW5jZWQgZGF0YSBjaGFuZ2VcbiAgICBpZiAocGF0aCkge1xuICAgICAgICBhZGRyICAgPSBwYXRoO1xuICAgICAgICBhZGRyICAgPSBhZGRyLnNwbGl0KCcuJyk7XG4gICAgICAgIGtleSAgICA9IGFkZHIucG9wKCk7XG4gICAgICAgIHRhcmdldCA9IHRoaXM7XG5cbiAgICAgICAgZm9yICh2YXIgaT0wLCBsZW49YWRkci5sZW5ndGg7IGk8bGVuOyBpKz0xKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXRbYWRkcltpXV07XG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXRba2V5XSA9IGRhdGE7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGZ1bGwgZGF0YSBjaGFuZ2VcbiAgICBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgaiBpbiBkYXRhKSB7XG4gICAgICAgICAgICB0aGlzW2pdID0gZGF0YVtqXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVtaXQuY2FsbCh0aGlzKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgQ2FsbGJhY2sgSGFuZGxlcnMgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBDYWxscyBhbGwgY2FsbGJhY2tzIHJlZ2lzdGVyZWQgdG8gcmVjZWl2ZSBkYXRhIGNoYW5nZSBldmVudHNcbiAqL1xuZnVuY3Rpb24gZW1pdCgpIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnM7XG5cbiAgICBmb3IgKHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaSAtPSAxKSB7XG4gICAgICAgIGxpc3RlbmVyc1tpXSh0aGlzKTtcbiAgICB9XG59XG5cbi8qKlxuICogQWRkcyBhIG5ldyBsaXN0ZW5lciB0byB0aGUgbW9kZWxcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIGEgbW9kZWwncyBkYXRhIGhhcyBjaGFuZ2VkXG4gKi9cbmZ1bmN0aW9uIGFkZExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdmFyIGxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzO1xuXG4gICAgaWYgKGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKSA8IDApIHtcbiAgICAgICAgbGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgIC8vIFRyaWdnZXIgY2FsbGJhY2tzIGlmIG1vZGVsIGhhcyBhbHJlYWR5IGJlZW4gbG9hZGVkXG4gICAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAwLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmcm9tIHRoZSBtb2RlbFxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byByZW1vdmUgZnJvbSB0aGUgbGlzdCBvZiBsaXN0ZW5lcnNcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnM7XG4gICAgdmFyIGluZGV4ICAgICA9IGxpc3RlbmVycy5pbmRleE9mKGNhbGxiYWNrKTtcblxuICAgIGlmIChpbmRleCA+PSAwKSB7IGxpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpOyB9XG5cbiAgICByZXR1cm4gdGhpcztcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSB0aGUgbW9kZWxcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG59XG5cbi8qKioqKioqKioqKioqKioqXG4gKiAgQ29udHJvbGxlciAgKlxuICoqKioqKioqKioqKioqKiovXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhc2NvdC1jb21wYXRpYmxlIGNvbnRyb2xsZXIgaW50ZXJmYWNlIGZvciB0aGUgbW9kZWxcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIEEgY29udHJvbGxlciBjYWxsYmFjayB0byBhc3NvY2lhdGUgd2l0aCB0aGUgbW9kZWxcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29udHJvbGxlcigvKiBjYWxsYmFja3MgKi8pIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcblxuICAgIHZhciBjb250cm9sbGVyID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVyKGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJncy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGFyZ3NbaV0obW9kZWwsIGVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNvbnRyb2xsZXIuYmluZCh0aGlzKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqXG4gKiAgQ29uc3RydWN0b3IgICpcbiAqKioqKioqKioqKioqKioqKi9cblxudmFyIE1vZGVsID0gZnVuY3Rpb24oc3JjLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAgICdzdG9yZUxvY2FsJyA6IHtcbiAgICAgICAgICAgIHZhbHVlICAgICAgICA6IG9wdGlvbnMuc3RvcmVMb2NhbCxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdwcmVmZXJPbmxpbmUnIDoge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogb3B0aW9ucy5wcmVmZXJPbmxpbmUsXG4gICAgICAgICAgICB3cml0YWJsZSAgICAgOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZSAgIDogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICAncHJvY2VzcycgOiB7XG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgOiBvcHRpb25zLnByb2Nlc3MsXG4gICAgICAgICAgICB3cml0YWJsZSAgICAgOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZSAgIDogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICAnc3JjJyA6IHtcbiAgICAgICAgICAgIHZhbHVlICAgICAgICA6IHNyYyxcbiAgICAgICAgICAgIHdyaXRhYmxlICAgICA6IHRydWUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlICAgOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZSA6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgICdsaXN0ZW5lcnMnIDoge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogW10sXG4gICAgICAgICAgICB3cml0YWJsZSAgICAgOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZSAgIDogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICAnaXNMb2FkZWQnIDoge1xuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogZmFsc2UsXG4gICAgICAgICAgICB3cml0YWJsZSAgICAgOiB0cnVlLFxuICAgICAgICAgICAgZW51bWVyYWJsZSAgIDogZmFsc2UsXG4gICAgICAgICAgICBjb25maWd1cmFibGUgOiBmYWxzZVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoc3JjKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3JjID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbG9hZC5jYWxsKHRoaXMsIHNyYyk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChzcmMgPT09IE9iamVjdChzcmMpKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGxvYWREaXJlY3REYXRhLmJpbmQodGhpcywgc3JjKSwgMCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKioqKioqKioqKioqKioqXG4gKiAgUHJvdG90eXBlICAqXG4gKioqKioqKioqKioqKioqL1xuXG5Nb2RlbC5wcm90b3R5cGUgPSB7XG4gICAgc3RvcmUgICAgICAgICAgICAgIDogc3RvcmUsXG4gICAgbG9hZCAgICAgICAgICAgICAgIDogbG9hZCxcbiAgICBzZXQgICAgICAgICAgICAgICAgOiBzZXQsXG4gICAgcmVzb2x2ZSAgICAgICAgICAgIDogcmVzb2x2ZSxcbiAgICBhZGRMaXN0ZW5lciAgICAgICAgOiBhZGRMaXN0ZW5lcixcbiAgICByZW1vdmVMaXN0ZW5lciAgICAgOiByZW1vdmVMaXN0ZW5lcixcbiAgICByZW1vdmVBbGxMaXN0ZW5lcnMgOiByZW1vdmVBbGxMaXN0ZW5lcnMsXG4gICAgY3JlYXRlQ29udHJvbGxlciAgIDogY3JlYXRlQ29udHJvbGxlclxufTtcblxuLyoqKioqKioqKioqKipcbiAqICBFeHBvcnRzICAqXG4gKioqKioqKioqKioqKi9cblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqKioqKioqKioqKioqKioqKlxuICogIERlcGVuZGVuY2llcyAgKlxuICoqKioqKioqKioqKioqKioqKi9cblxudmFyIENvbnRleHQgPSByZXF1aXJlKCcuL0NvbnRleHQnKTtcbnZhciBNb2RlbCAgID0gcmVxdWlyZSgnLi9Nb2RlbCcpO1xuXG4vLyBjbGFzc0xpc3QgcG9seWZpbGwgc3RpbGwgbmVjZXNzYXJ5IGZvciBzb21lIHRhcmdldHNcbnJlcXVpcmUoJy4uL2Jvd2VyX2NvbXBvbmVudHMvaHRtbDUtcG9seWZpbGxzL2NsYXNzTGlzdCcpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgQ29udGV4dCBIYW5kbGluZyAgKlxuICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGNvbnRleHQgb2JqZWN0IHdpdGggdGhlIGdpdmVuIGVsZW1lbnRcbiAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBBbiBIVE1MIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29udGV4dChlbGVtZW50KSB7XG5cdHJldHVybiBuZXcgQ29udGV4dChlbGVtZW50KTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqXG4gKiAgTW9kZWwgSGFuZGxpbmcgICpcbiAqKioqKioqKioqKioqKioqKioqKi9cblxudmFyIE1PREVMUyA9IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgb3IgcmV0dXJucyBhIG1vZGVsIGJhc2VkIG9uIHRoZSBwYXNzZWQgdXJsXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSB1cmwgcG9pbnRpbmcgdG8gdGhlIG1vZGVsJ3MgZGF0YSByZXNvdXJjZVxuICovXG5mdW5jdGlvbiBjcmVhdGVNb2RlbCh1cmwpIHtcblx0aWYgKE1PREVMU1t1cmxdKSB7IHJldHVybiBNT0RFTFNbdXJsXTsgfVxuXHRlbHNlIHtcblx0XHRNT0RFTFNbdXJsXSA9IG5ldyBNb2RlbCh1cmwpO1xuXHRcdHJldHVybiBNT0RFTFNbdXJsXTtcblx0fVxufVxuXG4vKioqKioqKioqXG4gKiAgQVBJICAqXG4gKioqKioqKioqL1xuXG52YXIgYXNjb3QgPSB7XG5cdGNyZWF0ZUNvbnRleHQgOiBjcmVhdGVDb250ZXh0LFxuXHRjcmVhdGVNb2RlbCAgIDogY3JlYXRlTW9kZWxcbn07XG5cbi8qKioqKioqKioqKioqXG4gKiAgRXhwb3J0cyAgKlxuICoqKioqKioqKioqKiovXG5cbm1vZHVsZS5leHBvcnRzID0gYXNjb3Q7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNzZXJ0ID0gY2hhaS5hc3NlcnQ7XG52YXIgc2FtcGxlRGF0YSA9IHtcbiAgICAndmFsQScgOiA3LFxuICAgICd2YWxCJyA6IDEzLFxuICAgICdncm91cEEnIDoge1xuICAgICAgICAndmFsQycgOiAxNyxcbiAgICAgICAgJ3ZhbEInIDogMTlcbiAgICB9XG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICogIEJhc2ljIE9iamVjdCBDb25zdHJ1Y3Rpb24gICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5kZXNjcmliZSgnQ29udGV4dCcsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhc2NvdCA9IHJlcXVpcmUoJy4uL3NjcmlwdHMvYXNjb3QuanMnKTtcbiAgICB2YXIgYXBwICAgPSBhc2NvdC5jcmVhdGVDb250ZXh0KCk7XG5cbiAgICBhcHAudXNlKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgIHZhciBjdHggPSBhc2NvdC5jcmVhdGVDb250ZXh0KGVsKTtcblxuICAgICAgICBjdHguYWRkKCc8ZGl2IGNsYXNzPVwidG9wXCI+PC9kaXY+JywgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgIHZhciBjdHggPSBhc2NvdC5jcmVhdGVDb250ZXh0KGVsKTtcblxuICAgICAgICAgICAgY3R4LmFkZCgnPGgxIGNsYXNzPVwidGVzdEgxXCI+SGVsbG8gV29ybGQhPC9oMT4nKTtcbiAgICAgICAgICAgIGN0eC5hZGQoJzx1bCBjbGFzcz1cInRlc3RVTFwiPjwvdWw+JywgZnVuY3Rpb24oZWwsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgY3R4ID0gYXNjb3QuY3JlYXRlQ29udGV4dChlbCk7XG5cbiAgICAgICAgICAgICAgICBjdHguYWRkKCc8bGk+SGVsbG88L2xpPjxsaT4nICsgb3B0aW9ucy5uYW1lICsgJzwvbGk+Jyk7XG4gICAgICAgICAgICB9LCB7IG5hbWUgOiAnUnlhbicgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgYXBwLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpO1xuXG4gICAgZGVzY3JpYmUoJ3VzZSgpICYgYWRkKCknLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBpdCgnc2hvdWxkIGRlcGxveSB0byB0aGUgZG9jdW1lbnQgYm9keScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGFwcC5lbGVtZW50LCBkb2N1bWVudC5ib2R5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBhZGQgYSBuZXcgZWxlbWVudCB0byB0aGUgRE9NJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaDEgPSBkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJy50ZXN0SDEnKTtcblxuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGgxLmlubmVySFRNTCwgJ0hlbGxvIFdvcmxkIScpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIGFkZCBhIHNlY29uZCBuZXcgZWxlbWVudCB0byB0aGUgRE9NJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhc3NlcnQub2soZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcudGVzdFVMJykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHBhc3Mgb3B0aW9ucyBpbiB0byBhIGNvbnRyb2xsZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jdW1lbnQuYm9keS5xdWVyeVNlbGVjdG9yKCcudGVzdFVMJyk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChsaXN0LmNoaWxkcmVuWzFdLmlubmVySFRNTCwgJ1J5YW4nKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdyZW1vdmUoKScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpdCgnc2hvdWxkIHJlbW92ZSBpdHNlbGYgZnJvbSBpdHMgcGFyZW50JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhc2NvdC5jcmVhdGVDb250ZXh0KGRvY3VtZW50LmJvZHkucXVlcnlTZWxlY3RvcignLnRvcCcpKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIGFzc2VydC5ub3RPayhkb2N1bWVudC5ib2R5LnF1ZXJ5U2VsZWN0b3IoJy50b3AnKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ21lcmdlKCknLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHZhciBjdHggPSBhc2NvdC5jcmVhdGVDb250ZXh0KGVsKTtcblxuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKCd0ZXN0QScpO1xuXG4gICAgICAgIGN0eC5tZXJnZSgnPGRpdiBjbGFzcz1cInRlc3RCXCIgZGF0YS10ZXN0PVwiNVwiPjxzcGFuPkNoaWxkQTwvc3Bhbj48c3Bhbj5DaGlsZEI8L3NwYW4+PC9kaXY+Jyk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBtZXJnZSBjbGFzcyBsaXN0cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKGVsLmNsYXNzTGlzdC5jb250YWlucygndGVzdEEnKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCd0ZXN0QicpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaXQoJ3Nob3VsZCBtZXJnZSBkYXRhLSogYXR0cmlidXRlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGVsLmdldEF0dHJpYnV0ZSgnZGF0YS10ZXN0JyksIDUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIG1lcmdlIGNoaWxkIGVsZW1lbnRzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoZWwuY2hpbGRyZW4ubGVuZ3RoLCAyKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChlbC5jaGlsZHJlblswXS5pbm5lckhUTUwsICdDaGlsZEEnKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChlbC5jaGlsZHJlblsxXS5pbm5lckhUTUwsICdDaGlsZEInKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuZGVzY3JpYmUoJ01vZGVsJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFzY290ID0gcmVxdWlyZSgnLi4vc2NyaXB0cy9hc2NvdC5qcycpO1xuICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xuXG4gICAgZGVzY3JpYmUoJ0NvbnN0cnVjdGlvbicsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGl0KCdzaG91bGQgbG9hZCByZXF1ZXN0ZWQgZGF0YScsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IGFzY290LmNyZWF0ZU1vZGVsKCdzYW1wbGUuanNvbicpO1xuXG4gICAgICAgICAgICBtb2RlbC5hZGRMaXN0ZW5lcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKGRhdGEpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChtb2RlbC52YWxBLCBzYW1wbGVEYXRhLnZhbEEpO1xuICAgICAgICAgICAgICAgIG1vZGVsLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpdCgnc2hvdWxkIHJlbG9hZCB0aGUgc2FtZSBtb2RlbCBpZiByZXF1ZXN0ZWQgYWdhaW4nLCBmdW5jdGlvbihkb25lKSB7XG4gICAgICAgICAgICB2YXIgbW9kZWxBID0gYXNjb3QuY3JlYXRlTW9kZWwoJ3NhbXBsZS5qc29uJyk7XG4gICAgICAgICAgICB2YXIgbW9kZWxCID0gYXNjb3QuY3JlYXRlTW9kZWwoJ3NhbXBsZS5qc29uJyk7XG5cbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChtb2RlbEEsIG1vZGVsQik7XG5cbiAgICAgICAgICAgIG1vZGVsQi5hZGRMaXN0ZW5lcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGRhdGEudmFsQSwgc2FtcGxlRGF0YS52YWxBKTtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnY3JlYXRlQ29udHJvbGxlcigpJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhc2NvdCA9IHJlcXVpcmUoJy4uL3NjcmlwdHMvYXNjb3QuanMnKTtcblxuICAgICAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhIHZhbGlkIGNvbnRyb2xsZXIgdGhhdCB0cmlnZ2VycyBhIG1vZGVsIHVwZGF0ZSBjYWxsYmFjaycsIGZ1bmN0aW9uKGRvbmUpIHtcbiAgICAgICAgICAgIHZhciBtb2RlbEEgPSBhc2NvdC5jcmVhdGVNb2RlbCgnc2FtcGxlLmpzb24nKTtcbiAgICAgICAgICAgIHZhciBhcHAgPSBhc2NvdC5jcmVhdGVDb250ZXh0KCk7XG4gICAgICAgICAgICB2YXIgY29udHJvbGxlciA9IG1vZGVsQS5jcmVhdGVDb250cm9sbGVyKGZ1bmN0aW9uKG1vZGVsLCBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG1vZGVsLCBtb2RlbEEpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnY29udHJvbGxlclRlc3QnKSk7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGFwcC51c2UoZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHZhciBjdHggPSBhc2NvdC5jcmVhdGVDb250ZXh0KGVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgY3R4LmFkZCgnPGRpdiBjbGFzcz1cImNvbnRyb2xsZXJUZXN0XCI+PC9kaXY+JywgY29udHJvbGxlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcbiJdfQ==
;