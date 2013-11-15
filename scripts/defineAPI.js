'use strict';

/**
 * Determines if a target object is a descriptor
 * @param {Object} desc A potential descriptor
 */
function isDescriptor(desc) {
    if (desc === Object(desc)) {
        if ('enm' in desc ||
            'cfg' in desc ||
            'wrt' in desc ||
            'val' in desc ||
            'get' in desc ||
            'set' in desc ||
            'enumerable' in desc ||
            'configurable' in desc ||
            'writable' in desc ||
            'value' in desc) {
            return true;
        }
    }

    return false;
}

/**
 * Expands a shorthand decriptor to a formal descriptor
 * @param {Object} descriptor A shorthand descriptor
 */
function expandDescriptor(descriptor) {
    var desc = {};

    if (isDescriptor(descriptor)) {
        for (var i in descriptor) {
            switch (i) {
            case 'enm' :
                desc.enumerable = descriptor.enm;
                break;
            case 'wrt' :
                desc.writable = descriptor.wrt;
                break;
            case 'cfg' :
                desc.configurable = descriptor.cfg;
                break;
            case 'val' :
                desc.value = descriptor.val;
                break;
            default :
                desc[i] = descriptor[i];
            }
        }
    } else {
        desc.value        = descriptor;
        desc.writable     = true;
        desc.enumerable   = true;
        desc.configurable = true;
    }

    return desc;
}

/**
 * Processes each descriptor, expanding to match property descriptor
 * format
 * @param  {Object} target      An object on which to define the API
 * @param  {Object} descriptors A set of shorthand property descriptors
 */
module.exports = function (target, descriptors) {
    
    // Adjust for single-argument
    if (arguments.length === 1) {
        descriptors = target;
        target      = {};
    }
    
    for (var i in descriptors) {
        descriptors[i] = expandDescriptor(descriptors[i]);
    }

    Object.defineProperties(target, descriptors);
    
    return target;
};