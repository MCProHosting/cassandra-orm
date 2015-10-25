var AlterTable = require('../../lib/cql/queries/alterTable');
var t  = require('../../lib/cql/types');

describe('alter table', function () {
    it('sets column type with strings', function () {
        expect(new AlterTable()
            .table('tbl')
            .type('col', 'text')
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl ALTER col TYPE text;'
        });
    });
    it('sets column type with column object', function () {
        expect(new AlterTable()
            .table('tbl')
            .type(t.Text('col'))
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl ALTER col TYPE text;'
        });
    });
    it('adds columns with strings', function () {
        expect(new AlterTable()
            .table('tbl')
            .add('col', 'text')
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl ADD col text;'
        });
    });
    it('adds columns with object', function () {
        expect(new AlterTable()
            .table('tbl')
            .add(t.Text('col'))
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl ADD col text;'
        });
    });
    it('drops columns', function () {
        expect(new AlterTable()
            .table('tbl')
            .drop(t.Text('col'))
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl DROP col;'
        });
    });
    it('renames columns', function () {
        expect(new AlterTable()
            .table('tbl')
            .rename('col1', 'col2')
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl RENAME col1 TO col2;'
        });
    });
    it('updates column properties single', function () {
        expect(new AlterTable()
            .table('tbl')
            .setProperties({ comment: 'Hello World' })
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl WITH comment = \'Hello World\';'
        });
    });
    it('updates column properties multiple', function () {
        expect(new AlterTable()
            .table('tbl')
            .setProperties({ comment: 'Hello World', read_repair_chance: 0.2 })
            .parameterize()
        ).toEqual({
            parameters: [],
            query: 'ALTER TABLE tbl WITH comment = \'Hello World\' AND read_repair_chance = 0.2;'
        });
    });
});
