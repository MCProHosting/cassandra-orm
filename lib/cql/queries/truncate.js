var Columns = require('../stmt/columns');
var Where = require('../stmt/where');
var Conditionals = require('../stmt/conditionals');
var Options = require('../stmt/options');
var Base = require('./base');
var util = require('../../util');

function Truncate () {
    Base.apply(this, arguments);

    this.parts = { table: null };
}

Truncate.prototype = new Base();

/**
 * Sets the table to truncate.
 * @param  {String|Table} table
 * @return {Truncate}
 */
Truncate.prototype.table = function (table) {
    this.parts.table = util.resolveName(table);
    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Truncate.prototype.parameterize = function () {
    return [[], 'TRUNCATE ' + this.parts.table + ';'];
};

module.exports = Truncate;
