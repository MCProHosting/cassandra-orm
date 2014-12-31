var collection = require('../lib/model/collection');
var connection = require('../spec/fake-connection');
var t = require('../lib/cql/types');

collection = connection().Collection('UsersStuff');
collection.columns([t.Text('a'), t.List('b')]);

new (require('benchmark').Suite)()
    .add('Select builder wrappings', function () {
        collection.select().then(function () {});
    })
    .add('Checkout new', function () {
        collection.new();
    })
    .add('Checkout new with property', function () {
        collection.define('a', 'b').new();
    })
    .add('Save', function () {
        var model = collection.new();
        model.a = 1;
        model.b = [2, 3];
        model.save();
    })
    .add('Update with diff', function () {
        var model = collection.new();
        model.sync({ a: 1, b: [3, 4] });
        model.a = 1;
        model.b = [2, 3];
        model.save();
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run();
