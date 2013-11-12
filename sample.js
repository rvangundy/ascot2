'use strict';

var ascot = require('ascot');
var Model = ascot.Model;
var app   = ascot.createContext(document);

app.add('<body></body>', function(el) {
    var ctx = ascot.createContext(el);

    ctx.add('<h1>Hello World!</h1>');
    ctx.add('<ul></ul>', function(el) {
        var model = new Model('some/data/source');

        model.bind(el, function(el, data) {
            var ctx = ascot.createContext(el);

            ctx.clear();

            for (var i = 0, len = data.length; i < len; i += 1) {
                ctx.add('<li>' + data[i] + '</li>');
            }
        });
    });
});

app.add(document.body);
