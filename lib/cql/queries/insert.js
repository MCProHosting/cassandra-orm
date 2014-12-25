var Columns = require('../stmt/columns');
var Tuple = require('../stmt/termTuple');
var Options = require('../stmt/options');
var Base = require('./base');
var util = require('../../util');

function Insert () {
    Base.apply(this, arguments);

    this.parts = {
        table: null,
        columns: new Columns(['*']),
        values: new Tuple(),
        options: new Options(),
        ifNotExists: false
    };

    util.proxyMethod(this, this.parts.options, 'timestamp');
    util.proxyMethod(this, this.parts.options, 'ttl');
}

Insert.prototype = new Base();

/**
 * Sets the table to select from.
 * @param  {String|Table} table
 * @return {Select}
 */
Insert.prototype.into = function (table) {
    this.parts.table = util.resolveName(table);
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
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Insert.prototype.parameterize = function () {
    // Get the values and parameters
    var values = this.parts.values.parameterize();
    var params = values[0];

    // Basic INSERT query
    var str = 'INSERT INTO ' + this.parts.table + ' ' +
        '(' + this.parts.columns + ') ' +
        'VALUES ' + values[1];

    // Add IF NOT EXISTS if necessary.
    if (this.parts.ifNotExists === true) {
        str += ' IF NOT EXISTS';
    }

    // Add in options
    var options = this.parts.options.toString();
    if (options.length > 0) {
        str += ' USING ' + options;
    }

    return [params, str + ';'];
};

module.exports = Insert;
