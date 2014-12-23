var QueryState = require('./base');
var constants = require('../../constants');
var util = require('../../../util');

/**
 * State for SELECT "column" functions. Allows aliasing, TTL, counting, and
 * WRITETIME.
 */
function SelectState() {
    QueryState.apply(this, arguments);
}

SelectState.prototype = new QueryState();

/**
 * Sets the column alias.
 * @return {String}
 * @return {QueryState}
 */
SelectState.prototype.as = function (alias) {
    this.modify.alias = alias;
    return this;
};

/**
 * Sets the query to get the TTL of the column
 * @return {QueryState}
 */
SelectState.prototype.ttl = function () {
    this.modify.fn = 'TTL';
    return this;
};

/**
 * Sets the query to get the count of the column.
 * @return {QueryState}
 */
SelectState.prototype.count = function () {
    this.modify.fn = 'COUNT';
    return this;
};

/**
 * Sets the query to get the count of the column.
 * @return {QueryState}
 */
SelectState.prototype.writeTime = function () {
    this.modify.fn = 'WRITETIME';
    return this;
};

/**
 * Sets the query to SELECT DISTINCT
 * @return {QueryState}
 */
SelectState.prototype.distinct = function () {
    this.modify.distinct = true;
    return this;
};
/**
 * dateOf timeuuid function
 * @return {SelectState}
 */
SelectState.prototype.dateOf = function () {
    this.modify.fn = 'dateOf';
    return this;
};

/**
 * minTimeuuid timeuuid function
 * @return {SelectState}
 */
SelectState.prototype.minTimeuuid = function () {
    this.modify.fn = 'minTimeuuid';
    return this;
};

/**
 * maxTimeuuid timeuuid function
 * @return {SelectState}
 */
SelectState.prototype.maxTimeuuid = function () {
    this.modify.fn = 'maxTimeuuid';
    return this;
};

/**
 * unixTimestampOf timeuuid function
 * @return {SelectState}
 */
SelectState.prototype.unixTimestampOf = function () {
    this.modify.fn = 'unixTimestampOf';
    return this;
};

/**
 * token function
 * @return {SelectState}
 */
SelectState.prototype.token = function () {
    this.modify.fn = 'token';
    return this;
};

/**
 * Makes the correct typeAsBlob function for the column.
 * @return {[type]} [description]
 */
SelectState.prototype.asBlob = function () {
    this.modify.fn = this.type + 'AsBlob';
    return this;
};

// Bind the blob conversion functions.
constants.baseTypes.forEach(function (type) {
    var fn = 'blobAs' + util.capFirst(type.toLowerCase());
    SelectState.prototype[fn] = function () {
        this.modify.fn = fn;
        return this;
    };
});

/**
 * Returns the parsed column name.
 * @return {String}
 */
SelectState.prototype.toString = function () {
    var output = this.name;
    if (this.modify.fn) {
        output = this.modify.fn + '(' + output + ')';
    }

    if (this.modify.alias) {
        output += ' as ' + this.modify.alias;
    }
    if (this.modify.distinct) {
        output = 'DISTINCT ' + output;
    }

    return output;
};

module.exports = SelectState;
