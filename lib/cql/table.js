var constants = require('./constants');
var cson = require('./cson');

function Table (name, connection) {
    this.name = name;
    this.connection = connection;

    this.columns = [];
    this.properties = [];
    this.keys = { partition: [], compound: [] };
}

/**
 * Returns the table name
 *
 * @return {String}
 */
Table.prototype.getName = function () {
    return this.name;
};

/**
 * Sets the table name
 *
 * @return {Table}
 */
Table.prototype.setName = function (name) {
    this.name = name;
    return this;
};

/**
 * Adds a column to the table.
 *
 * @param  {Column} column
 * @return {Table}
 */
Table.prototype.addColumn = function (column) {
    this.columns.push(column);

    if (column.isKey.partition) {
        this.addPartitionKey(column);
    } else if (column.isKey.compound) {
        this.addCompoundKey(column);
    }

    return this;
};

/**
 * Gets the primary keys from the table.
 * @return {[]String}
 */
Table.prototype.getKeys = function () {
    return this.primaryKeys;
};

/**
 * Adds a new partition key...
 * @param  {String} key
 * @return {Table}
 */
Table.prototype.addPartitionKey = function (key) {
    this.keys.partition.push(key);
    return this;
};

/**
 * Adds a new compound key on the table.
 * @param {String} key
 * @return {Table}
 */
Table.prototype.addCompoundKey = function (key) {
    this.keys.compound.push(key);
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
Table.prototype.addProperty = function (key, value) {
    if (typeof value === 'undefined') {
        this.properties.push(key);
    } else if (key === 'caching') {
        // Caching seems to use quoted JSON, unlike other properties.
        this.properties.push(key + '=\'' + JSON.stringify(value) + '\'');
    } else {
        this.properties.push(key + '=' + cson.encode(value));
    }

    return this;
};

/**
 * Creates the CQL representation of the table (CREATE TABLE).
 * @return {String}
 */
Table.prototype.toString = function () {
    var output = ['CREATE TABLE ' + this.name + ' ('];

    // Add each column to the statement.
    this.columns.forEach(function (column) {
        output.push(constants.indent + column.getEntry() + ',');
    });

    var keys = this.keys;
    if (keys.partition.length > 0 || keys.compound.length > 0) {
        // Add the primary keys if we have any.

        var keyStrs = this.keys.compound;
        if (keys.partition.length > 1) {
            keyStrs.unshift('(' + keys.partition.join(', ') + ')');
        } else if (keys.partition.length === 1) {
            keyStrs.unshift(keys.partition[0]);
        }

        output.push(
            constants.indent +
            'PRIMARY KEY ' +
            '(' + keyStrs.join(', ') + ')'
        );
    } else if (this.columns.length > 0) {
        // Trim off the trailing comma of the last column.
        output[output.length - 1] = output[output.length - 1].slice(0, -1);
    }

    // If we defined table properties, add those.
    if (this.properties.length > 0) {
        output.push(') WITH ' + this.properties.join(
            ' AND' +
            constants.lineDelimiter +
            constants.indent
        ));
    } else {
        output.push(')');
    }

    // And we're done!
    return output.join(constants.lineDelimiter);
};

module.exports = Table;
