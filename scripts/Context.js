'use strict';

/******************
 *  Dependencies  *
 ******************/

var defineAPI = require('./defineAPI');

/*****************
 *  Composition  *
 *****************/

/**
 * Specifies the use of additional controllers by this context
 * @param {Function} controller A controller to use in this context
 */
function use(/* arguments */) {
    var controllers = Array.prototype.slice.call(arguments, 0);
    var element     = this.element = this.element || document.createDocumentFragment();

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

    return children.length === 1 ? children[0] : children;
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

Context.prototype = defineAPI({
    use          : use,
    add          : add,
    appendTo     : appendTo,
    insertBefore : insertBefore,
    remove       : remove,
    select       : select,
    selectAll    : selectAll,
    attr         : getAttribute,
    merge        : mergeElements
});

/*************
 *  Exports  *
 *************/

module.exports = Context;
