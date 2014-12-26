var Model = require('../../lib/model/model');

describe('Model', function () {
    var model, collection;
    beforeEach(function () {
        collection = { table: { columns: ['a', 'b']}};
        model = new Model(collection);
        model.sync({ a: 1, b: [2, 3] });
    });

    it('guards hidden properties', function () {
        expect(Object.keys(model)).toEqual(['a', 'b']);
    });

    it('clones old properties', function () {
        model.a = 2;
        model.b.push(4);
        expect(model.old).toEqual({ a: 1, b: [2, 3] });
    });

    it('works with isDirty', function () {
        expect(model.isDirty('b')).toBe(false);
        model.b.push(4);
        expect(model.isDirty('b')).toBe(true);
    });

    it('works with isSynced', function () {
        expect(model.isSynced()).toBe(true);
        model.b.push(4);
        expect(model.isSynced()).toBe(false);
    });

    it('gets raw object', function () {
        expect(model.toObject()).toEqual({ a: 1, b: [2, 3] });
    });

    it('json stringifies', function () {
        expect(model.toJson()).toBe('{"a":1,"b":[2,3]}');
    });
});
