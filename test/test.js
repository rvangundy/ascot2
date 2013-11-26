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

describe('Model', function() {
    var ascot = require('../scripts/ascot.js');
    localStorage.clear();

    describe('Construction', function() {

        it('should load requested data', function(done) {
            var model = ascot.createModel('sample.json');

            model.addListener(function(data) {
                assert.ok(data);
                assert.equal(model.data.valA, sampleData.valA);
                model.removeAllListeners();
                done();
            });
        });

        it('should reload the same model if requested again', function(done) {
            var modelA = ascot.createModel('sample.json');
            var modelB = ascot.createModel('sample.json');

            assert.equal(modelA, modelB);

            modelB.addListener(function() {
                assert.equal(modelB.data.valA, sampleData.valA);
                done();
            });
        });
    });

    describe('createController()', function() {
        var ascot = require('../scripts/ascot.js');

        it('should call bound controllers when models are updated', function(done) {
            var modelA = ascot.createModel('list.json');
            var app = ascot();

            app.use(function(element) {
                var ctx  = ascot(element);
                ctx.add('<ul></ul>', modelA.createController(function(element, model) {
                    assert.equal(element.tagName, 'UL');
                    assert.equal(model, modelA);
                    done();
                }));
            });
        });
    });
});
