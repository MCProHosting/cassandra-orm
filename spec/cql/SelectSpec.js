var Select = require('../../lib/cql/queries/select');
var Raw = require('../../lib/cql/stmt/raw');
var Table = require('../../lib/cql/table');
var t  = require('../../lib/cql/types');

describe('select', function () {
    var table;
    beforeEach(function () {
        table = new Table('tbl');
    });

    it('select specific columns as strings', function () {
        expect(new Select()
            .columns('a', 'b')
            .from('tbl')
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'SELECT a, b FROM tbl;'
        });
    });

    describe('select', function () {
        it('builds a basic select', function () {
            expect(new Select()
                .from(table)
                .parameterize()
            ).toEqual({
                parameters: [],
                query: 'SELECT * FROM tbl;'
            });
        });

        it('also accepts a string table name', function () {
            expect(new Select()
                .from('tbl')
                .parameterize()
            ).toEqual({
                parameters: [],
                query: 'SELECT * FROM tbl;'
            });
        });

        it('select specific columns', function () {
            expect(new Select()
                .columns(t.Text('a').as('q'), t.Text('b'))
                .from('tbl')
                .parameterize()
            ).toEqual({
                parameters: [],
                query: 'SELECT a as q, b FROM tbl;'
            });
        });

        it('select specific columns as strings', function () {
            expect(new Select()
                .columns('a', 'b')
                .from('tbl')
                .parameterize()
            ).toEqual({
                parameters: [],
                query: 'SELECT a, b FROM tbl;'
            });
        });
    });

    it('hooks into where', function () {
        expect(new Select()
            .columns('a', 'b')
            .from('tbl')
            .where(t.Text('a'), '<', 3)
            .andWhere('z', new Raw('x'))
            .andWhere('c', '>', 2)
            .parameterize()
        ).toEqual({
            parameters: [
                { key: 'a', value: 3 },
                { key: 'c', value: 2 }
            ],
            query: 'SELECT a, b FROM tbl WHERE a < ? AND z > x AND c > ?;'
        });
    });

    it('adds limit', function () {
        expect(new Select()
            .from(table)
            .limit(5)
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'SELECT * FROM tbl LIMIT 5;'
        });
    });

    it('orders', function () {
        expect(new Select()
            .from(table)
            .orderBy('a', 'asc')
            .orderBy(t.Text('b').desc())
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'SELECT * FROM tbl ORDER BY a ASC, b DESC;'
        });
    });

    it('allows filter', function () {
        expect(new Select()
            .from(table)
            .filter()
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'SELECT * FROM tbl ALLOW FILTERING;'
        });
    });
});
