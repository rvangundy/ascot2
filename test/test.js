'use strict';
// this is a test

var assert = chai.assert;

/*******************************
 *  Basic Object Construction  *
 *******************************/

describe('Context', function() {
    var ascot = require('../scripts/ascot.js');
    var app   = ascot();

    app.use(function(el) {
        var ctx = ascot(el);

        ctx.merge('<div class="top"></div>');

        ctx.use(function(el) {
            var ctx = ascot(el);

            ctx.add('<h1 class="testH1">Hello World!</h1>');
            ctx.add('<ul class="testUL"></ul>', function(el) {
                var ctx = ascot(el);

                ctx.add('<li>Hello</li><li>Ryan</li>');
            });
        });
    });

    app.appendTo(document.body);

    describe('createContext()', function() {
        ascot('<div class="test">', function(el) {
            it('should create a new element and apply controllers', function() {
                assert.ok(el.classList.contains('test'));
            });
        });
    });

    describe('use() & add()', function() {

        it('should add a new element to the DOM', function() {
            var h1 = document.body.querySelector('.testH1');

            assert.equal(h1.innerHTML, 'Hello World!');
        });

        it('should add a second new element to the DOM', function() {
            assert.ok(document.body.querySelector('.testUL'));
        });
    });

    describe('remove()', function() {
        it('should remove itself from its parent', function() {
            ascot(document.body.querySelector('.top')).remove();
            assert.notOk(document.body.querySelector('.top'));
        });
    });

    describe('merge()', function() {
        var el = document.createElement('div');
        var ctx = ascot(el);

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
