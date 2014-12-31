var Assignment = require('../stmt/assignment');
var Options = require('../stmt/options');
var Where = require('../stmt/where');
var Conditionals = require('../stmt/conditionals');
var Base = require('./base');
var util = require('../../util');

function Update () {
    Base.apply(this, arguments);

    this.parts = {
        table: null,
        assignment: new Assignment(),
        options: new Options(),
        where: new Where(),
        conditionals: new Conditionals()
    };
}

Update.prototype = new Base();

util.proxyMethod(Update.prototype, 'parts.assignment.subtract');
util.proxyMethod(Update.prototype, 'parts.assignment.add');
util.proxyMethod(Update.prototype, 'parts.assignment.setRaw');
util.proxyMethod(Update.prototype, 'parts.assignment.setSimple');
util.proxyMethod(Update.prototype, 'parts.assignment.setIndex');
util.proxyMethod(Update.prototype, 'parts.assignment.set');
util.proxyMethod(Update.prototype, 'parts.where.where');
util.proxyMethod(Update.prototype, 'parts.where.andWhere');
util.proxyMethod(Update.prototype, 'parts.where.orWhere');
util.proxyMethod(Update.prototype, 'parts.conditionals.when');
util.proxyMethod(Update.prototype, 'parts.options.timestamp');
util.proxyMethod(Update.prototype, 'parts.options.ttl');

/**
 * Sets the table to update.
 * @param  {String|Table} table
 * @return {Update}
 */
Update.prototype.table = function (table) {
    this.parts.table = util.resolveName(table);
    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Update.prototype.parameterize = function () {
    var str = 'UPDATE ' + this.parts.table;
    var params = [];

    // Add in options
    str += this.addPart('options', ' USING ');
    str += this.addParameterized(params, 'assignment', ' SET ');
    str += this.addParameterized(params, 'where', ' WHERE ');
    str += this.addParameterized(params, 'conditionals', ' IF ');

    return [params, str + ';'];
};

module.exports = Update;
