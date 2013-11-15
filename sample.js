'use strict';

var ascot = require('ascot');
var app   = ascot.createContext(document);

var model = ascot.createModel('sample.json');

var modelController = model.createController(function(el, model) {
    var ctx = ascot.createContext(el);

    ctx.clear();

    for (var i = 0, len = model.length; i < len; i += 1) {
        ctx.add('<li>' + model[i] + '</li>');
    }
});

app.add('<body></body>', function(el) {
    var ctx = ascot.createContext(el);

    ctx.add('<h1>Hello World!</h1>');
    ctx.add('<ul></ul>', function(el) {
        var ctx = ascot.createContext(el);

        var model = new Model('some/data/source');

        model.bind(el, );
    });
});
