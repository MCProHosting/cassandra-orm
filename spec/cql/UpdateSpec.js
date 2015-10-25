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
        ).toEqual({
            parameters: [{ key: 'a', value: 'b' }],
            query: 'UPDATE tbl SET a = ?;'
        });
    });
    it('generates multiple', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .set('c', 2, 4)
            .parameterize()
        ).toEqual({
            parameters: [
                { key: 'a', value: 'b' },
                { key: undefined, value: 2 },
                { key: 'c', value: 4 }
            ],
            query: 'UPDATE tbl SET a = ?, c [?] = ?;'
        });
    });
    it('using', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .timestamp(30)
            .ttl(60)
            .parameterize()
        ).toEqual({
            parameters: [{ key: 'a', value: 'b' }],
            query: 'UPDATE tbl USING TIMESTAMP 30 AND TTL 60 SET a = ?;'
        });
    });
    it('where', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .where('c', '=', 3)
            .parameterize()
        ).toEqual({
            parameters: [{ key: 'a', value: 'b' }, { key: 'c', value: 3 }],
            query: 'UPDATE tbl SET a = ? WHERE c = ?;'
        });
    });
    it('conditional', function () {
        expect(new Update()
            .table(new Table('tbl'))
            .set('a', 'b')
            .when('c', 3)
            .parameterize()
        ).toEqual({
            parameters: [{ key: 'a', value: 'b' }, { key: 'c', value: 3 }],
            query: 'UPDATE tbl SET a = ? IF c = ?;'
        });
    });
});
