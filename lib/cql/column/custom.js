var basic = require('./basic');
var _ = require('lodash');

/**
 * Represents a custom-type column in Cassandra.
 *
 * @param {String} name Name of the collection.
 * @param {String} type The name of the custom type.
 */
function CustomColumn (name, type) {
    basic.call(this, name, 'frozen <' + type + '>');
}

_.extend(CustomColumn.prototype, basic.prototype);

module.exports = CustomColumn;
