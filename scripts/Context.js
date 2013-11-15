'use strict';

/******************
 *  Dependencies  *
 ******************/

var defineAPI = require('./defineAPI');

/****************
 *  Collection  *
 ****************/

/**
 * A key/value pair collection that uses an HTML element as the key
 * @type {Object}
 */
var COLLECTION = {
    contexts : [],
    elements : [],
    add : function(context) {
        this.contexts.push(context);
        this.elements.push(context.element);
    },
    remove : function(context) {
        var index = this.contexts.indexOf(context);

        if (index >= 0) {
            this.contexts.splice(index, 1);
            this.elements.splice(index, 1);
        }
    },
    seek : function(element) {
        var index = this.elements.indexOf(element);

        if (index >= 0) { return this.contexts[index]; }
    }
};

/**
 * Seeks and returns a context by element if it exists.
 * @param {Element} element The element whose context to retrieve
 * @return {Context} The context object corresponding to the passed element
 */
function getContextByElement(element) {
    return COLLECTION.seek(element);
}

/**
 * Removes a context from the collection
 * @param {Context} context The context to remove
 */
function removeContext() {
    COLLECTION.remove(this);
}

/*****************
 *  Composition  *
 *****************/

/**
 * Specifies the use of additional controllers by this context
 * @param {Function} controller A controller to use in this context
 */
function use(/* arguments */) {
    var element, frag;
    var controllers = Array.prototype.slice.call(arguments, 0);

    // If no element exists, use a div tag and place in a fragment so event handlers register
    if (!this.element) {
        frag = document.createDocumentFragment();
        element = this.element = document.createElement('div');
        frag.appendChild(element);
    } else {
        element = this.element;
    }

    // Call each controller
    for (var i = 0, len = controllers.length; i < len; i += 1) {
        controllers[i](element);
    }

    return this;
}

/**
 * Adds a new innerHTML string to be used when building this context
 * @param {String}   innerHTML   A new HTML string to add to this context
 * @param {Function} controller  A controller to use in this context
 * @return {Element}             The element or elements that have just been created
 */
function add(/* arguments */) {
    var children, frag;
    var child   = arguments[0];
    var args    = Array.prototype.slice.call(arguments, 1);
    var element = this.element = this.element || this.use().element;
    var div     = document.createElement('div');

    // Add view-controller
    if (typeof child === 'function') {
        frag = document.createDocumentFragment();
        child(frag);
        children = frag.childNodes;
        element.appendChild(frag);
    }

    // Add string HTML
    else {
        div.innerHTML = child.trim();
        children      = Array.prototype.slice.call(div.children, 0);

        for (var j = 0, lenJ = children.length; j < lenJ; j += 1) {
            element.appendChild(children[j]);
        }
    }

    // Call 'use' on each added element
    for (var i = 0, len = children.length; i < len; i += 1) {
        use.apply({ element : children[i]}, args);
    }

    return children.length === 1 ? children[0] : children;
}

/**
 * Deploys the context's content on to the given target element
 * @param {Element} target A target element within which to insert new elements
 */
function appendTo(target) {
    target.appendChild(this.element);

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
    this.element = element || document.createElement('div');
    COLLECTION.add(this);
};

/************
 *  Static  *
 ************/

Context.getByElement = getContextByElement;

/***************
 *  Prototype  *
 ***************/

Context.prototype = defineAPI({
    use          : use,
    add          : add,
    appendTo     : appendTo,
    insertBefore : insertBefore,
    remove       : remove,
    destroy      : removeContext,
    select       : select,
    selectAll    : selectAll,
    attr         : getAttribute,
    merge        : mergeElements
});

/*************
 *  Exports  *
 *************/

module.exports = Context;
