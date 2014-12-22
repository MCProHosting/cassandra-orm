var BasicColumn = require('../../lib/cql/column/basic');
var CollectionColumn = require('../../lib/cql/column/collection');
var CustomColumn = require('../../lib/cql/column/custom');

describe('basic column', function () {
    it('should generate entry', function () {
        var column = new BasicColumn('name', 'text');
        expect(column.getEntry()).toBe('name text');
    });
    it('should add static types', function () {
        var column = new BasicColumn('name', 'text').addAttr('static');
        expect(column.getEntry()).toBe('name text STATIC');
    });
});

describe('collection column', function () {
    it('should work with single basic type', function () {
        var column = new CollectionColumn('emails', 'list', [new BasicColumn(null, 'text')]);
        expect(column.getEntry()).toBe('emails list<text>');
    });
    it('should work with multiple types', function () {
        var column = new CollectionColumn('high_scores', 'map', [
            new BasicColumn(null, 'text'),
            new BasicColumn(null, 'int')
        ]);
        expect(column.getEntry()).toBe('high_scores map<text, int>');
    });
    it('should freeze tuples', function () {
        var column = new CollectionColumn('high_scores', 'tuple', [
            new BasicColumn(null, 'text'),
            new BasicColumn(null, 'int')
        ]);
        expect(column.getEntry()).toBe('high_scores frozen <tuple<text, int>>');
    });
    it('should nest types', function () {
        var column = new CollectionColumn('high_scores', 'tuple', [
            new BasicColumn(null, 'text'),
            new CollectionColumn(null, 'list', [new BasicColumn(null, 'int')])
        ]);
        expect(column.getEntry()).toBe('high_scores frozen <tuple<text, list<int>>>');
    });
});

describe('custom column', function () {
    it('should work correctly', function () {
        var column = new CustomColumn('name', 'funType');
        expect(column.getEntry()).toBe('name frozen <funType>');
    });
});
