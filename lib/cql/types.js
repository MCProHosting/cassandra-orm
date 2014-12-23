var BasicColumn = require('./column/basic');
var CollectionColumn = require('./column/collection');
var constants = require('./constants');

module.exports = {};

// Define basic types.
constants.baseTypes.forEach(function (type) {
    module.exports[type] = function (name) {
        return new BasicColumn(name, type.toLowerCase());
    };
});

// Collection types.
constants.setTypes.forEach(function (type) {
    module.exports[type] = function (name, nested) {
        return new CollectionColumn(name, type.toLowerCase(), nested);
    };
});
