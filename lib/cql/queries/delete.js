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
        columns: new Columns(),
        where: new Where(),
        options: new Options(),
        conditionals: new Conditionals()
    };
}

Delete.prototype = new Base();

util.proxyMethod(Delete.prototype, 'parts.where.where');
util.proxyMethod(Delete.prototype, 'parts.where.andWhere');
util.proxyMethod(Delete.prototype, 'parts.where.orWhere');
util.proxyMethod(Delete.prototype, 'parts.options.timestamp');
util.proxyMethod(Delete.prototype, 'parts.options.ttl');
util.proxyMethod(Delete.prototype, 'parts.conditionals.when');
util.proxyMethod(Delete.prototype, 'parts.columns.columns');

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

    return { parameters: params, query: str + ';' };
};

module.exports = Delete;
