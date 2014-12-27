var diff = require('../../lib/model/diff');
var t = require('../../lib/cql/types');

describe('diff', function () {
    function record (method) {
        calls.push([].slice.call(arguments));
    }
    var calls;
    var query = {
        setSimple: record.bind(null, 'setSimple'),
        add: record.bind(null, 'add'),
        subtract: record.bind(null, 'subtract')
    };

    beforeEach(function () {
        calls = [];
    });

    it('doesnt modify not changed', function () {
        var column = t.Int('a');
        diff(query, column, 1, 1);
        expect(calls).toEqual([]);
    });

    it('detects changed basic elements', function () {
        var column = t.Int('a');
        diff(query, column, 1, 2);
        expect(calls).toEqual([['setSimple', column, 2]]);
    });

    describe('sets', function () {
        var column = t.Set('a');
        it('detects new values in array', function () {
            diff(query, column, [1, 2, 3], [1, 2, 3, 4]);
            expect(calls).toEqual([['add', column, [4]]]);
        });
        it('detects removed values from array', function () {
            diff(query, column, [1, 2, 3], [2, 1]);
            expect(calls).toEqual([['subtract', column, [3]]]);
        });
        it('detects reset', function () {
            diff(query, column, [1, 2, 3], []);
            expect(calls).toEqual([['setSimple', column, []]]);
        });
        it('doesnt update when not necessary', function () {
            diff(query, column, [1, 2, 3], [1, 2, 3]);
            expect(calls).toEqual([]);
        });
        it('works with large rewrites', function () {
            diff(query, column, [1, 2, 3], [4, 5, 6]);
            expect(calls).toEqual([['setSimple', column, [4, 5, 6]]]);
        });
        it('doesnt break on empties', function () {
            diff(query, column, [], [1]);
            expect(calls).toEqual([['setSimple', column, [1]]]);
            calls = [];
            diff(query, column, [1], []);
            expect(calls).toEqual([['setSimple', column, []]]);
            calls = [];
            diff(query, column, [], []);
            expect(calls).toEqual([]);
        });
    });

    describe('lists', function () {
        var column = t.List('a');
        it('detects appended values', function () {
            diff(query, column, [1, 2, 3], [1, 2, 3, 4, 5]);
            expect(calls).toEqual([['add', column, [4, 5]]]);
        });
        it('detects prepended values', function () {
            diff(query, column, [1, 2, 3], [-1, 0, 1, 2, 3]);
            expect(calls).toEqual([['add', [0, -1], column]]);
        });
        it('detects removed values', function () {
            diff(query, column, [1, 2, 1, 2, 1], [1, 1, 1]);
            expect(calls).toEqual([['subtract', column, [2]]]);
        });
        it('rewrites if not all removed (forward)', function () {
            diff(query, column, [1, 2, 1, 2, 1], [1, 2, 1, 1]);
            expect(calls).toEqual([['setSimple', column, [1, 2, 1, 1]]]);
        });
        it('rewrites if not all removed (backward)', function () {
            diff(query, column, [1, 2, 1, 2, 1], [1, 1, 2, 1]);
            expect(calls).toEqual([['setSimple', column, [1, 1, 2, 1]]]);
        });
        it('rewrites if changes in middle of list', function () {
            diff(query, column, [1, 2, 3, 4, 5], [1, 2, 4, 4, 5]);
            expect(calls).toEqual([['setSimple', column, [1, 2, 4, 4, 5]]]);
        });
        it('doesnt update when not necessary', function () {
            diff(query, column, [1, 2, 3], [1, 2, 3]);
            expect(calls).toEqual([]);
        });
        it('works with large rewrites', function () {
            diff(query, column, [1, 2, 3], [4, 5, 6]);
            expect(calls).toEqual([['setSimple', column, [4, 5, 6]]]);
        });
        it('doesnt break on empties', function () {
            diff(query, column, [], [1]);
            expect(calls).toEqual([['setSimple', column, [1]]]);
            calls = [];
            diff(query, column, [1], []);
            expect(calls).toEqual([['setSimple', column, []]]);
            calls = [];
            diff(query, column, [], []);
            expect(calls).toEqual([]);
        });
    });

    describe('sets', function () {
        var column = t.Map('a');
        it('detects added values', function () {
            diff(query, column, { a: 1, b: 2 }, { a: 1, b: 2, c: 3 });
            expect(calls).toEqual([['add', column, { c: 3 }]]);
        });
        it('detects removed values', function () {
            diff(query, column, { a: 1, b: 2 }, { a: 1 });
            expect(calls).toEqual([['subtract', column, ['b']]]);
        });
        it('detects edited values', function () {
            diff(query, column, { a: 2, b: 2 }, { a: 1, b: 2 });
            expect(calls).toEqual([['add', column, { a: 1 }]]);
        });
        it('doesnt update when not necessary', function () {
            diff(query, column, { a: 1, b: 2 }, { a: 1, b: 2 });
            expect(calls).toEqual([]);
        });
    });
    describe('date', function () {
        it('doesnt change same', function () {
            var column = t.Timestamp('a');
            diff(query, column, new Date(0), new Date(0));
            expect(calls).toEqual([]);
        });
        it('changes when different', function () {
            var column = t.Timestamp('a');
            diff(query, column, new Date(0), new Date(1));
            expect(calls).toEqual([['setSimple', column, new Date(1)]]);
        });
    });

    // describe('removal from sets and lists', function () {
    //     it('detects removes from array end', function () {
    //         diff(query, { a: [1, 2], b: [2] }, { a: [1], b: [2]});
    //         expect(calls).toEqual([['subtract', 'a', 2]]);
    //     });

    //     it('detects removes from array middle', function () {
    //         diff(query, { a: [1, 2, 3], b: [2] }, { a: [1, 3], b: [2]});
    //         expect(calls).toEqual([['subtract', 'a', 2]]);
    //     });

    //     it('detects removes from array start', function () {
    //         diff(query, { a: [1, 2, 3], b: [2] }, { a: [2, 3], b: [2]});
    //         expect(calls).toEqual([['subtract', 'a', 1]]);
    //     });
    // });
});
