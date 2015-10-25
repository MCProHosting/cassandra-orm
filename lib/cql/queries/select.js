var Columns = require('../stmt/columns');
var Where = require('../stmt/where');
var Order = require('../stmt/order');
var Base = require('./base');
var util = require('../../util');

function Select () {
    Base.apply(this, arguments);

    this.parts = {
        table: null,
        columns: new Columns(['*']),
        where: new Where(),
        order: new Order(),
        limit: '',
        filter: false
    };
}

Select.prototype = new Base();

util.proxyMethod(Select.prototype, 'parts.where.where');
util.proxyMethod(Select.prototype, 'parts.where.andWhere');
util.proxyMethod(Select.prototype, 'parts.where.orWhere');
util.proxyMethod(Select.prototype, 'parts.order.orderBy');
util.proxyMethod(Select.prototype, 'parts.columns.columns');

/**
 * Sets the table to select from.
 * @param  {String|Table} table
 * @return {Select}
 */
Select.prototype.from = function (table) {
    this.parts.table = util.resolveName(table);
    return this;
};

/**
 * Limits the query to the number of results.
 * @param  {Number|String} amt
 * @return {Select}
 */
Select.prototype.limit = function (amt) {
    this.parts.limit = parseInt(amt, 10);
    return this;
};

/**
 * Turns on (or off) filtering.
 * @param  {Boolean=true} set
 * @return {Select}
 */
Select.prototype.filter = function (set) {
    this.parts.filter = typeof set === 'undefined' ? true : set;
    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Select.prototype.parameterize = function () {
    var str = '';
    var params = [];

    str += 'SELECT ' + this.parts.columns.toString() + ' ';
    str += 'FROM ' + this.parts.table;

    str += this.addParameterized(params, 'where', ' WHERE ');
    str += this.addPart('order', ' ORDER BY ');
    str += this.addPart('limit', ' LIMIT ');

    if (this.parts.filter) {
        str += ' ALLOW FILTERING';
    }

    return { parameters: params, query: str + ';' };
};

module.exports = Select;
