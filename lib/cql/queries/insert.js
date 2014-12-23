var Columns = require('../stmt/columns');
var Tuple = require('../stmt/termTuple');
var Table = require('../table');

function Insert () {
    this.parts = {
        table: null,
        columns: new Columns(['*']),
        values: new Tuple(),
        options: [],
        ifNotExists: false
    };
}

/**
 * Sets the table to select from.
 * @param  {String|Table} table
 * @return {Select}
 */
Insert.prototype.into = function (table) {
    if (table instanceof Table) {
        this.parts.table = table.getName();
    } else {
        this.parts.table = table;
    }

    return this;
};

/**
 * Sets the insert columns.
 * @param {String...} columns
 * @return {Insert}
 */
Insert.prototype.columns = function () {
    this.parts.columns = new Columns([].slice.call(arguments));
    return this;
};

/**
 * Sets the insert values.
 * @return {Insert}
 */
Insert.prototype.values = function () {
    this.parts.values.setTerms([].slice.call(arguments));
    return this;
};

/**
 * Inserts an object column > value map.
 * @param  {Object} map
 * @return {Insert}
 */
Insert.prototype.data = function (map) {
    var columns = [];
    var values = [];

    for (var key in map) {
        columns.push(key);
        values.push(map[key]);
    }

    this.columns.apply(this, columns);
    this.values.apply(this, values);

    return this;
};

/**
 * Adds the IF NOT EXISTS qualifier.
 * @return {Insert}
 */
Insert.prototype.ifNotExists = function () {
    this.parts.ifNotExists = true;
    return this;
};

/**
 * Adds a timestamp option to the insert.
 * @return {Insert}
 */
Insert.prototype.timestamp = function (amt) {
    this.parts.options.push('TIMESTAMP ' + amt);
    return this;
};

/**
 * Adds a ttl option to the insert.
 * @return {Insert}
 */
Insert.prototype.ttl = function (amt) {
    this.parts.options.push('TTL ' + amt);
    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Insert.prototype.parameterize = function () {
    // Get the values and parameters
    var values = this.parts.values.parameterize();
    var parameters = values[0];

    // Basic INSERT query
    var output = 'INSERT INTO ' + this.parts.table + ' ' +
        '(' + this.parts.columns + ') ' +
        'VALUES ' + values[1];

    // Add IF NOT EXISTS if necessary.
    if (this.parts.ifNotExists === true) {
        output += ' IF NOT EXISTS';
    }

    // Add in options
    if (this.parts.options.length > 0) {
        output += ' USING ' + this.parts.options.join(' AND ');
    }

    return [parameters, output += ';'];
};

module.exports = Insert;
