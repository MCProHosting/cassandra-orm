var Update = require('../../lib/cql/queries/update');
var Raw = require('../../lib/cql/stmt/raw');
var Table = require('../../lib/cql/table');
var t  = require('../../lib/cql/types');

describe('insert', function () {
    it('generates basic', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .parameterize()
        ).toEqual([['b'], 'UPDATE tbl SET a = ?;']);
    });
    it('generates multiple', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .set('c', 2, 4)
            .parameterize()
        ).toEqual([['b', 2, 4], 'UPDATE tbl SET a = ?, c [?] = ?;']);
    });
    it('using', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .timestamp(30)
            .ttl(60)
            .parameterize()
        ).toEqual([['b'], 'UPDATE tbl USING TIMESTAMP 30 AND TTL 60 SET a = ?;']);
    });
    it('where', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .where('c', '=', 3)
            .parameterize()
        ).toEqual([['b', 3], 'UPDATE tbl SET a = ? WHERE c = ?;']);
    });
    it('conditional', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .when('c', 3)
            .parameterize()
        ).toEqual([['b', 3], 'UPDATE tbl SET a = ? IF c = ?;']);
    });
});
