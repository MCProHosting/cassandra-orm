var Where = require('../../lib/cql/stmt/where');
var Order = require('../../lib/cql/stmt/order');
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
            .by(new Raw('a DESC'))
            .toString()
        ).toBe('a DESC');
    });
    it('orders by column modifier', function () {
        expect(new Order()
            .by(t.Text('a').desc())
            .toString()
        ).toBe('a DESC');
    });
    it('orders by column name string', function () {
        expect(new Order()
            .by('a', 'DESC')
            .toString()
        ).toBe('a DESC');
    });
    it('orders by multiple', function () {
        expect(new Order()
            .by('a', 'DESC')
            .by('b', 'ASC')
            .toString()
        ).toBe('a DESC, b ASC');
    });
});
