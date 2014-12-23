var Insert = require('../../lib/cql/queries/insert');
var Raw = require('../../lib/cql/stmt/raw');
var Table = require('../../lib/cql/table');
var t  = require('../../lib/cql/types');

describe('insert', function () {
    var table;
    beforeEach(function () {
        table = new Table('tbl');
    });

    it('generates basic', function () {
        expect(new Insert()
            .into(table)
            .columns('a', 'b')
            .values(1, 2)
            .parameterize()
        ).toEqual([[1, 2], 'INSERT INTO tbl (a, b) VALUES (?, ?);']);
    });
    it('accepts raw', function () {
        expect(new Insert()
            .into(table)
            .columns(t.Text('a'), 'b')
            .values(1, new Raw(2))
            .parameterize()
        ).toEqual([[1], 'INSERT INTO tbl (a, b) VALUES (?, 2);']);
    });
    it('works with map', function () {
        expect(new Insert()
            .into(table)
            .data({ 'a': 1, 'b': 2 })
            .parameterize()
        ).toEqual([[1, 2], 'INSERT INTO tbl (a, b) VALUES (?, ?);']);
    });
    it('adds if not exists', function () {
        expect(new Insert()
            .into(table)
            .ifNotExists()
            .columns('a', 'b')
            .values(1, 2)
            .parameterize()
        ).toEqual([[1, 2], 'INSERT INTO tbl (a, b) VALUES (?, ?) IF NOT EXISTS;']);
    });
    it('uses one option', function () {
        expect(new Insert()
            .into(table)
            .columns('a', 'b')
            .values(1, 2)
            .ttl(30)
            .parameterize()
        ).toEqual([[1, 2], 'INSERT INTO tbl (a, b) VALUES (?, ?) USING TTL 30;']);
    });
    it('uses both options', function () {
        expect(new Insert()
            .into(table)
            .columns('a', 'b')
            .values(1, 2)
            .ttl(30)
            .timestamp(100)
            .parameterize()
        ).toEqual([[1, 2], 'INSERT INTO tbl (a, b) VALUES (?, ?) USING TTL 30 AND TIMESTAMP 100;']);
    });
});
