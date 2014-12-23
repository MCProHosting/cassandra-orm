var Delete = require('../../lib/cql/queries/delete');
var Raw = require('../../lib/cql/stmt/raw');
var Table = require('../../lib/cql/table');
var t  = require('../../lib/cql/types');

describe('insert', function () {
    var table;
    beforeEach(function () {
        table = new Table('tbl');
    });

    it('generates basic no columns', function () {
        expect(new Delete()
            .from(table)
            .parameterize()
        ).toEqual([[], 'DELETE FROM tbl;']);
    });

    it('generates basic with columns', function () {
        expect(new Delete()
            .columns('a', 'b')
            .from(table)
            .parameterize()
        ).toEqual([[], 'DELETE a, b FROM tbl;']);
    });

    it('where', function () {
        expect(new Delete()
            .from(table)
            .where('a', '=', 'b')
            .parameterize()
        ).toEqual([['b'], 'DELETE FROM tbl WHERE a = ?;']);
    });

    it('options', function () {
        expect(new Delete()
            .from(table)
            .ttl(30)
            .parameterize()
        ).toEqual([[], 'DELETE FROM tbl USING TTL 30;']);
    });

    it('conditional', function () {
        expect(new Delete()
            .from(table)
            .when('a', 'b')
            .parameterize()
        ).toEqual([['b'], 'DELETE FROM tbl IF a = ?;']);
    });

    it('complex', function () {
        expect(new Delete()
            .from(table)
            .columns('a', 'b')
            .when('a', 'b')
            .where('q', '=', new Raw('w'))
            .ttl(30)
            .parameterize()
        ).toEqual([['b'], 'DELETE a, b FROM tbl USING TTL 30 WHERE q = w IF a = ?;']);
    });
});
