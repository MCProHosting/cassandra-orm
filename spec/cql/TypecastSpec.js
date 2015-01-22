var errors = require('../../lib/errors');
var typecast = require('../../lib/cql/typecast');
var columns = require('../../lib/cql/types');

describe('single typecasts', function () {
    it('works for integers', function () {
        var c = columns.Int('col');
        expect(typecast(c, 2)).toBe(2);
        expect(typecast(c, '2')).toBe(2);
        expect(typecast(c, '2.5')).toBe(2);

        expect(function () {
            typecast(c, 'asdf');
        }).toThrow(new errors.InvalidType());
    });
    it('works for floats', function () {
        var c = columns.Float('col');
        expect(typecast(c, 2.5)).toBe(2.5);
        expect(typecast(c, '2')).toBe(2);
        expect(typecast(c, '2.5')).toBe(2.5);

        expect(function () {
            typecast(c, 'asdf');
        }).toThrow(new errors.InvalidType());
    });
    it('works for strings', function () {
        var c = columns.Text('col');
        expect(typecast(c, 2)).toBe('2');
        expect(typecast(c, 'asdf')).toBe('asdf');
    });
    it('works for booleans', function () {
        var c = columns.Boolean('col');
        expect(typecast(c, true)).toBe(true);
        expect(typecast(c, false)).toBe(false);
        expect(typecast(c, 1)).toBe(true);
        expect(typecast(c, 0)).toBe(false);
    });
    it('works for timestamps', function () {
        var c = columns.Timestamp('col');
        expect(typecast(c, 42)).toEqual(new Date(42));
        expect(typecast(c, new Date(42))).toEqual(new Date(42));
        expect(typecast(c, { toDate: function () { return new Date(42); }})).toEqual(new Date(42));

        expect(function () {
            typecast(c, 'asdf');
        }).toThrow(new errors.InvalidType());
    });
    it('works for buffer', function () {
        var c = columns.BLOB('col');
        expect(Buffer.isBuffer(typecast(c, 'foo'))).toBe(true);
        expect(typecast(c, 'foo').toString('utf8')).toBe('foo');
    });
});

describe('collection typecasts', function () {
    it('works on sets and lists', function () {
        var c = columns.Set('col', ['int']);
        expect(typecast(c, [1, '2.5', 3.6])).toEqual([1, 2, 3]);
        expect(function () {
            typecast(c, [1, 'foo', 3.6]);
        }).toThrow(new errors.InvalidType());
    });
    it('works for maps', function () {
        var c = columns.Map('col', ['int', 'int']);
        expect(typecast(c, {
            1: '2',
            '2': 3,
            '4': '5.6'
        })).toEqual({ 1: 2, 2: 3, 4: 5});


        expect(function () {
            typecast(c, { 'foo': 2 });
        }).toThrow(new errors.InvalidType());
        expect(function () {
            typecast(c, { 1: 'foo' });
        }).toThrow(new errors.InvalidType());
    });

    it('works for tuples', function () {
        var c = columns.Tuple('col', ['int', 'text']);
        expect(typecast(c, ['1', '2'])).toEqual([1, '2']);
        expect(typecast(c, [1, 2])).toEqual([1, '2']);

        expect(function () {
            typecast(c, ['a', 2]);
        }).toThrow(new errors.InvalidType());
    });
});
