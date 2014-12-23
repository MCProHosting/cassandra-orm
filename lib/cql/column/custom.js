var Column = require('./basic');

/**
 * Represents a custom-type column in Cassandra.
 *
 * @param {String} name Name of the collection.
 * @param {String} type The name of the custom type.
 */
function CustomColumn (name, type) {
    Column.call(this, name, 'frozen <' + type + '>');
}

CustomColumn.prototype = new Column();

module.exports = CustomColumn;
