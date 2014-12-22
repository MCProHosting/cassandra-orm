var _ = require('lodash');
var constants = require('./constants');
var util = require('../util');
var cson = require('./cson');

function Table (name) {
    this.name = name;
    this.columns = [];
    this.properties = [];
    this.primaryKeys = [];
}

/**
 * Adds a column to the table.
 *
 * @param  {Column} column
 * @return {Table}
 */
Table.prototype.addColumn = function (column) {
    this.columns.push(column);
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
    var first = this.primaryKeys[0];

    if (typeof first === 'undefined') {
        // Add a new key at the first index if none exist yet.
        this.primaryKeys = [key];
    } else if (_.isArray(first)) {
        // If there are multiple at the first index, just add a new one.
        first.push(key);
    } else {
        // Otherwise, turn the first index into an array.
        this.primaryKeys[0] = [first, key];
    }

    return this;
};

/**
 * Adds a new compound key on the table.
 * @param {String} key
 * @return {Table}
 */
Table.prototype.addCompoundKey = function (key) {
    this.primaryKeys.push(key);
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

    if (this.primaryKeys.length > 0) {
        // Add the primary keys if we have any.
        output.push(
            constants.indent +
            'PRIMARY KEY ' +
            util.deepJoin(this.primaryKeys, ['(', ')'], ', ')
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
