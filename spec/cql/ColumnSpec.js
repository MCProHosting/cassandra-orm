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
    it('sets partition keying', function () {
        var column = new BasicColumn('name', 'text');
        expect(column.isKey).toEqual({ partition: false, compound: false });
        column.partitionKey();
        expect(column.isKey).toEqual({ partition: true, compound: false });
    });
    it('sets compount keying', function () {
        var column = new BasicColumn('name', 'text');
        expect(column.isKey).toEqual({ partition: false, compound: false });
        column.compoundKey();
        expect(column.isKey).toEqual({ partition: false, compound: true });
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

describe('column states', function () {
    it('select functions', function () {
        var column = new BasicColumn('name');
        expect(column.as('foo').toString()).toBe('name as foo');
        expect(column.ttl().toString()).toBe('TTL(name)');
        expect(column.count().toString()).toBe('COUNT(name)');
        expect(column.writeTime().toString()).toBe('WRITETIME(name)');
        expect(column.distinct().toString()).toBe('DISTINCT name');
        expect(column.count().as('foo').toString()).toBe('COUNT(name) as foo');
        expect(column.dateOf().toString()).toBe('dateOf(name)');
        expect(column.minTimeuuid().toString()).toBe('minTimeuuid(name)');
        expect(column.maxTimeuuid().toString()).toBe('maxTimeuuid(name)');
        expect(column.unixTimestampOf().toString()).toBe('unixTimestampOf(name)');
        expect(column.token().toString()).toBe('token(name)');
    });
    it('orders functions', function () {
        var column = new BasicColumn('name');
        expect(column.desc().toString()).toBe('name DESC');
        expect(column.asc().toString()).toBe('name ASC');
    });
    it('blob functions', function () {
        var column = new BasicColumn('name', 'text');
        expect(column.asBlob().toString()).toBe('textAsBlob(name)');
        expect(column.blobAsText().toString()).toBe('blobAsText(name)');
    });
});
