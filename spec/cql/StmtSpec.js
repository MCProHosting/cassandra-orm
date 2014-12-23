var Where = require('../../lib/cql/stmt/where');
var Order = require('../../lib/cql/stmt/order');
var Assignment = require('../../lib/cql/stmt/assignment');
var Conditionals = require('../../lib/cql/stmt/conditionals');
var Tuple = require('../../lib/cql/stmt/termTuple');
var Raw = require('../../lib/cql/stmt/raw');
var t = require('../../lib/cql/types');

describe('where', function () {
    it('takes basic raw', function () {
        expect(new Where()
            .where(new Raw('foo'))
            .where(new Raw('bar'))
            .parameterize()
        ).toEqual([[], 'foo AND bar']);
    });
    it('parameterizes constants', function () {
        expect(new Where()
            .where('a', '<', 3)
            .parameterize()
        ).toEqual([[3], 'a < ?']);
    });
    it('does not parameterize raw', function () {
        expect(new Where()
            .where('a', '<', new Raw(3))
            .parameterize()
        ).toEqual([[], 'a < 3']);
    });
    it('chains correct', function () {
        expect(new Where()
            .where('a', '<', 3)
            .orWhere('b', '=', 2)
            .andWhere('c', '>', 1)
            .parameterize()
        ).toEqual([[3, 2, 1], 'a < ? OR b = ? AND c > ?']);
    });
    it('nests correctly', function () {
        expect(new Where()
            .where('a', '<', 3)
            .orWhere(function (w) {
                w.where('r', '>', 1).orWhere('z', '>', new Raw('x'));
            })
            .andWhere('c', '>', 2)
            .parameterize()
        ).toEqual([[3, 1, 2], 'a < ? OR (r > ? OR z > x) AND c > ?']);
    });
    it('handles column tuples', function () {
        expect(new Where()
            .where(['a', 'b'], '<', 3)
            .parameterize()
        ).toEqual([[3], '(a, b) < ?']);
    });
    it('handles term tuples', function () {
        expect(new Where()
            .where('a', '<', new Tuple(1, 2, new Tuple(3, new Raw(4))))
            .parameterize()
        ).toEqual([[1, 2, 3], 'a < (?, ?, (?, 4))']);
    });
    it('does not mutilate complex types', function () {
        expect(new Where()
            .where('a', '<', [1, 2, 3])
            .andWhere('b', '>', { q: 1, w: 2 })
            .parameterize()
        ).toEqual([[[1, 2, 3], { q: 1, w: 2 }], 'a < ? AND b > ?']);
    });
});

describe('order', function () {
    it('orders with raw string', function () {
        expect(new Order()
            .orderBy(new Raw('a DESC'))
            .toString()
        ).toBe('a DESC');
    });
    it('orders by column modifier', function () {
        expect(new Order()
            .orderBy(t.Text('a').desc())
            .toString()
        ).toBe('a DESC');
    });
    it('orders by column name string', function () {
        expect(new Order()
            .orderBy('a', 'DESC')
            .toString()
        ).toBe('a DESC');
    });
    it('orders by multiple', function () {
        expect(new Order()
            .orderBy('a', 'DESC')
            .orderBy('b', 'ASC')
            .toString()
        ).toBe('a DESC, b ASC');
    });
});

describe('conditionals', function () {
    it('works with none', function () {
        expect(new Conditionals()
            .parameterize()
        ).toEqual([[], '']);
    });
    it('works with one', function () {
        expect(new Conditionals()
            .when('a', 1)
            .parameterize()
        ).toEqual([[1], 'a = ?']);
    });
    it('works with many', function () {
        expect(new Conditionals()
            .when('a', 1)
            .when('b', 2)
            .when('c', 3)
            .parameterize()
        ).toEqual([[1, 2, 3], 'a = ? AND b = ? AND c = ?']);
    });
});

describe('assignment', function () {
    it('takes raw string', function () {
        expect(new Assignment()
            .set(new Raw('key = value'))
            .parameterize()
        ).toEqual([[], 'key = value']);
    });

    it('works as column_name = value', function () {
        expect(new Assignment()
            .set('key', 'value')
            .parameterize()
        ).toEqual([['value'], 'key = ?']);

        expect(new Assignment()
            .set('key', new Raw('value'))
            .parameterize()
        ).toEqual([[], 'key = value']);
    });

    it('works as set_or_list_item = set_or_list_item + ...', function () {
        expect(new Assignment()
            .add('set', 'value')
            .parameterize()
        ).toEqual([['value'], 'set = set + ?']);

        expect(new Assignment()
            .add('set', new Raw('value'))
            .parameterize()
        ).toEqual([[], 'set = set + value']);
    });

    it('works as column_name [ term ] = value', function () {
        expect(new Assignment()
            .set('set', 2, 'value')
            .parameterize()
        ).toEqual([[2, 'value'], 'set [?] = ?']);

        expect(new Assignment()
            .set('set', new Raw(2), new Raw('value'))
            .parameterize()
        ).toEqual([[], 'set [2] = value']);
    });
});
