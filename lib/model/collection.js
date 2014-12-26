var Table = require('../cql/table');
var util = require('../util');

/**
 * Represents a "table" in the database. Allows you to perform operations
 * against the whole of the database set.
 *
 * @param {Connection} connection
 * @param {String} name
 */
function Collection (connection, name) {
    this.connection = connection;
    this.name = name;
    this._table = new Table(util.toSnakeCase(name), connection);
}

/**
 * Sets the models columns.
 *
 * @param  {[]Column} columns
 * @return {Collection}
 */
Collection.prototype.columns = function (columns) {
    columns.forEach(this._table.addColumn.bind(this._table));
    return this;
};

/**
 * Adds a compound key to the table.
 * @param  {Column} column
 * @return {Collection}
 */
Collection.prototype.compoundKey = function (column) {
    this._table.addCompoundKey(column);
    return this;
};

/**
 * Adds a partition key to the table.
 * @param  {Column} column
 * @return {Collection}
 */
Collection.prototype.partitionKey = function (column) {
    this._table.addPartitionKey(column);
    return this;
};

/**
 * Adds a property to the table. You can pass in "key" as a plain string,
 * or key and value which will be added like `key = JSON.encode(value)` which
 * seems to work well for Cassandra's selection of table properties.
 *
 * @param {String} key
 * @param {String=} value
 */
Collection.prototype.tableProperty = function (key, value) {
    this._table.addProperty(key, value);
    return this;
};

/**
 * Returns a table for this collection.
 * @return {Table}
 */
Collection.prototype.table = function () {
    return this._table;
};

module.exports = Collection;
