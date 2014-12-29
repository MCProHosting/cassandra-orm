var Model = require('../../lib/model/model');
var Bluebird = require('bluebird');
var t = require('../../lib/cql/types');
var Connection = require('../fake-connection');

describe('Model', function () {
    var model, collection, connection;
    beforeEach(function () {
        connection = Connection();
        collection = connection.Collection('foo');
        collection.columns([
            t.Int('a').partitionKey(),
            t.List('b')
        ]);

        model = collection.new();
        model.sync({ a: 1, b: [2, 3] });
    });

    it('guards hidden properties', function () {
        expect(Object.keys(model)).toEqual(['a', 'b']);
    });

    it('clones old properties', function () {
        model.a = 2;
        model.b.push(4);
        expect(model.old).toEqual({ a: 1, b: [2, 3] });
    });

    it('works with isDirty', function () {
        expect(model.isDirty('b')).toBe(false);
        model.b.push(4);
        expect(model.isDirty('b')).toBe(true);
    });

    it('works with isSynced', function () {
        expect(model.isSynced()).toBe(true);
        model.b.push(4);
        expect(model.isSynced()).toBe(false);
    });

    it('gets raw object', function () {
        expect(model.toObject()).toEqual({ a: 1, b: [2, 3] });
    });

    it('json stringifies', function () {
        expect(model.toJson()).toBe('{"a":1,"b":[2,3]}');
    });

    describe('saving', function () {

        it('saves as new', function (done) {
            model.reset();
            model.a = 1;
            model.b = [2, 3];

            expect(model.isSynced()).toBe(false);
            model.save().then(function () {
                expect(connection.queryLog).toEqual([
                    ['INSERT INTO foo (a, b) VALUES (?, ?);', [1, [2, 3]], {}]
                ]);
                expect(model.isSynced()).toBe(true);
                done();
            });
        });

        it('updates existing', function (done) {
            model.a = 2;
            model.b = [2, 3, 4];

            expect(model.isSynced()).toBe(false);
            model.save().then(function () {
                expect(connection.queryLog).toEqual([
                    ['UPDATE foo SET a = ?, b = b + ? WHERE a = ?;', [2, [4], 1], {}]
                ]);
                expect(model.isSynced()).toBe(true);
                done();
            });
        });

        it('deletes', function (done) {
            model.delete().then(function () {
                expect(connection.queryLog).toEqual([
                    ['DELETE FROM foo WHERE a = ?;', [1], {}]
                ]);
                done();
            });
        });
    });
});
