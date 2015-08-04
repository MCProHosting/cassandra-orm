var t = require('../../lib/cql/types');
var Connection = require('../fake-connection');

describe('Model', function () {
    var model, collection, connection;
    beforeEach(function () {
        connection = Connection();
        collection = connection.Collection('foo');
        collection.columns([
            t.Int('a').partitionKey(),
            t.List('b', ['int'])
        ]);

        model = collection.new();
        model.sync({ a: 1, b: [2, 3] });
    });

    it('guards hidden properties', function () {
        expect(Object.keys(model)).toEqual(['a', 'b']);
    });

    it('extends works', function () {
        expect(model.toObject()).toEqual({ a: 1, b: [2, 3] });
        model.extend({ a: 2, b : [3]});
        expect(model.toObject()).toEqual({ a: 2, b: [3] });
        model.extend({ a: 5 });
        expect(model.toObject()).toEqual({ a: 5, b: [3] });
    });

    it('typecasts', function () {
        model.a = '2';
        expect(model.toObject()).toEqual({ a: 2, b: [2, 3] });
    });

    it('clones old properties', function () {
        model.a = 2;
        model.b.push(4);
        expect(model._.old).toEqual({ a: 1, b: [2, 3] });
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

    it('sync fixes casing', function () {
        model.sync({ A: 3 });
        expect(model.a).toBe(3);
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

        it('doesnt save when synced', function (done) {
            model.save().then(function () {
                expect(connection.queryLog).toEqual([]);
                done();
            });
        });

        it('applies options', function (done) {
            model.reset();
            model.a = 1;
            model.b = [2, 3];

            model.save({ ttl: 30 }).then(function () {
                expect(connection.queryLog).toEqual([
                    ['INSERT INTO foo (a, b) VALUES (?, ?) USING TTL 30;', [1, [2, 3]], {}]
                ]);
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

        it('saves on partial updates (issue #1)', function (done) {
            var model = collection.new().sync({ a: 3 });
            model.a = 4;

            model.save().then(function () {
                expect(connection.queryLog).toEqual([
                    ['UPDATE foo SET a = ? WHERE a = ?;', [4, 3], {}]
                ]);
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

    describe('middleware', function () {
        it('adds, runs single', function (done) {
            var spy = jasmine.createSpy('beforeUpdate');
            collection.use('beforeUpdate', function (next) {
                spy();
                next();
            });

            model.save(true).then(function () {
                expect(spy).toHaveBeenCalled();
                done();
            });
        });
        it('catches error in cb', function (done) {
            collection.use('beforeUpdate', function (next) {
                next('err');
            });

            model.save(true).catch(function (e) {
                expect(e).toBe('err');
                done();
            });
        });
        it('catches error when thrown', function (done) {
            collection.use('beforeUpdate', function (next) {
                throw 'err';
            });

            model.save(true).catch(function (e) {
                expect(e).toBe('err');
                done();
            });
        });
        it('handles multiple middleware', function (done) {
            var calls = [];
            collection.use('beforeUpdate', function (next) {
                calls.push('a');
                next();
            });
            collection.use('beforeUpdate', function (next) {
                calls.push('b');
                next();
            });
            collection.use('afterUpdate', function (next) {
                calls.push('c');
                next();
            });

            model.save(true).then(function () {
                expect(calls).toEqual(['a', 'b', 'c']);
                done();
            });
        });
        it('can define multiple at once', function (done) {
            var spy = jasmine.createSpy('up');
            collection.use(['beforeUpdate', 'afterUpdate'], function (next) {
                spy();
                next();
            });

            model.save(true).then(function () {
                expect(spy).toHaveBeenCalled();
                expect(spy.calls.count()).toBe(2);
                done();
            });
        });
    });

    describe('getters and setters', function () {
        it('works with new models', function () {
            model = collection.new().extend({ a: 9 });
            expect(model.isSynced()).toBe(false);
        });
        it('updates value without setter', function () {
            model.a = 9;
            expect(model.a).toBe(9);
        });
        it('works with setter alone', function () {
            model._.setters.a = function (value) {
                return value + 'c';
            };
            model.bindAccessors();
            model.a = 'b';
            expect(model.a).toBe('bc');
        });
        it('works with getter alone', function () {
            model._.getters.a = function (value) {
                return value + 'd';
            };
            model.bindAccessors();
            model.a = 'b';
            expect(model.a).toBe('bd');
        });
        it('works with both getter and setter', function () {
            model._.setters.a = function (value) {
                return value + 'c';
            };
            model._.getters.a = function (value) {
                return value + 'd';
            };
            model.bindAccessors();
            model.a = 'b';
            expect(model.a).toBe('bcd');
        });
        it('toObject functions correctly', function () {
            expect(model.toObject()).toEqual({ a: 1, b: [2, 3] });
            model._.getters.a = function (value) {
                return value + 2;
            };
            model.bindAccessors();
            expect(model.toObject()).toEqual({ a: 3, b: [2, 3] });
            expect(model.toObject(false)).toEqual({ a: 1, b: [2, 3] });
        });
    });
});
