var Columns = require('../stmt/columns');
var Where = require('../stmt/where');
var Order = require('../stmt/order');
var Table = require('../table');

function Select () {
    this.parts = {
        table: null,
        columns: new Columns(['*']),
        where: new Where(),
        order: new Order(),
        limit: null,
        filter: false
    };
}

/**
 * Sets the table to select from.
 * @param  {String|Table} table
 * @return {Select}
 */
Select.prototype.from = function (table) {
    if (table instanceof Table) {
        this.parts.table = table.getName();
    } else {
        this.parts.table = table;
    }

    return this;
};

/**
 * Sets the select columns.
 * @param {String...} columns
 * @return {Select}
 */
Select.prototype.columns = function () {
    this.parts.columns = new Columns([].slice.call(arguments));
    return this;
};

/**
 * Adds a "where" clause to the query.
 * @return {Select}
 */
Select.prototype.andWhere =
Select.prototype.where = function () {
    this.parts.where.andWhere.apply(this.parts.where, arguments);
    return this;
};

/**
 * Adds a "where" clause to the query.
 * @return {Select}
 */
Select.prototype.orWhere = function () {
    this.parts.where.orWhere.apply(this.parts.where, arguments);
    return this;
};

/**
 * Sets the ordering of the query. Can be called multiple times.
 * @return {Select}
 */
Select.prototype.orderBy = function () {
    this.parts.order.by.apply(this.parts.order, arguments);
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
 * @param  {Boolean} set
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

    var where = this.parts.where.parameterize();
    if (where[1].length) {
        str += ' WHERE ' + where[1];
        params = params.concat(where[0]);
    }

    var order = this.parts.order.toString();
    if (order.length) {
        str += ' ORDER BY ' + order;
    }

    if (this.parts.limit !== null) {
        str += ' LIMIT ' + this.parts.limit;
    }
    if (this.parts.filter) {
        str += ' ALLOW FILTERING';
    }

    return [params, str + ';'];
};

module.exports = Select;
