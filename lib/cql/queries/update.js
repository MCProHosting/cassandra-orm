var Assignment = require('../stmt/assignment');
var Options = require('../stmt/options');
var Where = require('../stmt/where');
var Conditionals = require('../stmt/conditionals');
var util = require('../../util');
var Base = require('./base');

function Update () {
    this.parts = {
        table: null,
        assignment: new Assignment(),
        options: new Options(),
        where: new Where(),
        conditionals: new Conditionals()
    };

    util.proxyMethod(this, this.parts.assignment, 'subtract');
    util.proxyMethod(this, this.parts.assignment, 'add');
    util.proxyMethod(this, this.parts.assignment, 'setRaw');
    util.proxyMethod(this, this.parts.assignment, 'setSimple');
    util.proxyMethod(this, this.parts.assignment, 'setIndex');
    util.proxyMethod(this, this.parts.assignment, 'set');

    util.proxyMethod(this, this.parts.where, 'where');
    util.proxyMethod(this, this.parts.where, 'andWhere');
    util.proxyMethod(this, this.parts.where, 'orWhere');

    util.proxyMethod(this, this.parts.conditionals, 'when');

    util.proxyMethod(this, this.parts.options, 'timestamp');
    util.proxyMethod(this, this.parts.options, 'ttl');
}

Update.prototype = new Base();

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
