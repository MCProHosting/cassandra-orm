var t = require('../../lib/cql/types');
var Connection = require('../fake-connection');
var Collection = require('../../lib/model/collection');

describe('collection', function () {
    var collection, connection;

    beforeEach(function () {
        connection = Connection();
        collection = connection.Collection('UsersStuff');
    });

    it('generates the table', function () {
        expect(collection
            .columns([
                t.Text('userid').index(),
                t.Set('emails', [t.Text()]),
                t.Text('name').partitionKey()
            ])
            .table
            .toString()
        ).toBe('CREATE TABLE users_stuff (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY (name)\r\n' +
            ');\r\n' +
            'CREATE INDEX ON users_stuff (userid);');
    });

    it('publishes columns', function () {
        var id = t.Text('uuid');
        var name = t.Text('first_name');
        collection.columns([id, name]);
        expect(collection.Uuid).toBe(id);
        expect(collection.FirstName).toBe(name);
    });

    it('populates models on select', function (done) {
        connection.resolvedQuery = { rows: [{ a: 1 }, { b: 1 }], meta: 'data'};
        collection.select().then(function (results) {
            expect(results.length).toBe(2);
            expect(results[0].isSynced()).toBe(true);
            expect(results.meta).toBe('data');
            done();
        });
    });

    it('selects', function (done) {
        collection.select().then(function () {
            expect(connection.queryLog).toEqual([
                ['SELECT * FROM users_stuff;', [], {}]
            ]);
            done();
        });
    });

    it('inserts', function (done) {
        collection.insert().data({ a: 'b' }).then(function () {
            expect(connection.queryLog).toEqual([
                ['INSERT INTO users_stuff (a) VALUES (?);', ['b'], {}]
            ]);
            done();
        });
    });

    it('updates', function (done) {
        collection.update().set('a', 'b').then(function () {
            expect(connection.queryLog).toEqual([
                ['UPDATE users_stuff SET a = ?;', ['b'], {}]
            ]);
            done();
        });
    });

    it('deletes', function (done) {
        collection.delete().where('a', '=', 'b').then(function () {
            expect(connection.queryLog).toEqual([
                ['DELETE FROM users_stuff WHERE a = ?;', ['b'], {}]
            ]);
            done();
        });
    });

    it('truncates', function (done) {
        collection.truncate().table('tbl').then(function () {
            expect(connection.queryLog).toEqual([
                ['TRUNCATE tbl;', [], {}]
            ]);
            done();
        });
    });
});
