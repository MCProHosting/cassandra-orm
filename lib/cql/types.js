var BasicColumn = require('./column/basic');
var CollectionColumn = require('./column/collection');

module.exports = {};

// Define basic types.
[
    'ASCII',
    'BigInt',
    'BLOB',
    'Boolean',
    'Counter',
    'Decimal',
    'Double',
    'Float',
    'IP',
    'Int',
    'Text',
    'Timestamp',
    'TimeUUID',
    'UUID',
    'VarChar',
    'VarInt'
].forEach(function (type) {
    module.exports[type] = function (name) {
        return new BasicColumn(name, type.toLowerCase());
    };
});

// Collection types.
[
    'Tuple',
    'List',
    'Map',
    'Set'
].forEach(function (type) {
    module.exports[type] = function (name, nested) {
        return new CollectionColumn(name, type.toLowerCase(), nested);
    };
});
