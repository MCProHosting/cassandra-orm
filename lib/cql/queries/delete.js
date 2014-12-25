var Columns = require('../stmt/columns');
var Where = require('../stmt/where');
var Conditionals = require('../stmt/conditionals');
var Options = require('../stmt/options');
var Base = require('./base');
var util = require('../../util');

function Delete () {
    Base.apply(this, arguments);

    this.parts = {
        table: null,
        columns: new Columns([]),
        where: new Where(),
        options: new Options(),
        conditionals: new Conditionals()
    };

    util.proxyMethod(this, this.parts.where, 'where');
    util.proxyMethod(this, this.parts.where, 'andWhere');
    util.proxyMethod(this, this.parts.where, 'orWhere');

    util.proxyMethod(this, this.parts.options, 'timestamp');
    util.proxyMethod(this, this.parts.options, 'ttl');

    util.proxyMethod(this, this.parts.conditionals, 'when');
}

Delete.prototype = new Base();

/**
 * Sets the table to Delete from.
 * @param  {String|Table} table
 * @return {Delete}
 */
Delete.prototype.from = function (table) {
    this.parts.table = util.resolveName(table);
    return this;
};

/**
 * Sets the Delete columns.
 * @param {String...} columns
 * @return {Delete}
 */
Delete.prototype.columns = function () {
    this.parts.columns = new Columns([].slice.call(arguments));
    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Delete.prototype.parameterize = function () {
    var str = '';
    var params = [];

    str += ('DELETE ' + this.parts.columns.toString()).trim() + ' ';
    str += 'FROM ' + this.parts.table;
    str += this.addPart('options', ' USING ');
    str += this.addParameterized(params, 'where', ' WHERE ');
    str += this.addParameterized(params, 'conditionals', ' IF ');

    return [params, str + ';'];
};

module.exports = Delete;
