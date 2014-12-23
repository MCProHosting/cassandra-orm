var util = require('../../util');

function Assignment () {
    this.parameters = [];
    this.assigments = [];
}

/**
 * Parameterizes the value if it isn't a raw string.
 * @param  {String|Raw} value
 * @return {String}
 */
Assignment.prototype.resolveValue = function (value) {
    if (!util.isRaw(value)) {
        this.parameters.push(value);
        return '?';
    } else {
        return value;
    }
};

/**
 * Adds a list or map item to an existing collection, or a number to
 * a counter column.
 *
 * @param {String|Column} column
 * @param {*} value
 * @return {Assignment}
 */
Assignment.prototype.subtract = function (column, value) {
    this.assigments.push(column + ' = ' + column + ' - ' + this.resolveValue(value));
    return this;
};

/**
 * Subtracts a list or map item to an existing collection, or a number from
 * a counter column.
 *
 * @param {String|Column} column
 * @param {*} value
 * @return {Assignment}
 */
Assignment.prototype.add = function (column, value) {
    this.assigments.push(column + ' = ' + column + ' + ' + this.resolveValue(value));
    return this;
};

/**
 * Adds an update:
 *
 *  - single argument: passed in as a raw update
 *  - two arguments passed: column = value format
 *  - three arguments: column [index] = value
 *
 * @param {String} column
 * @param {String|*} index
 * @param {*} value
 * @return {Assignment}
 */
Assignment.prototype.set = function (column, index, value) {
    // Just passed in a single string. Only take raw strings to prevent error
    // if people pass in input and don't check to see if it's defined.
    if (typeof index === 'undefined' && util.isRaw(column)) {
        return this.setRaw(column);
    }
    // Setting a value, not a property.
    if (typeof value === 'undefined') {
        return this.setSimple(column, index);
    }
    // Setting a property item.
    return this.setIndex(column, index, value);
};

/**
 * Adds a raw set to the assignment.
 * @param {String} str
 * @return {Assignment}
 */
Assignment.prototype.setRaw = function (str) {
    this.assigments.push(str.toString());
    return this;
};

/**
 * Adds a raw set to the assignment.
 * @param {String|Column} column
 * @param {*} value
 * @return {Assignment}
 */
Assignment.prototype.setSimple = function (column, value) {
    this.assigments.push(column + ' = ' + this.resolveValue(value));
    return this;
};

/**
 * Sets the column [index] = value in the query.
 * @param {String} column
 * @param {String|*} index
 * @param {*} value
 * @return {Assignment}
 */
Assignment.prototype.setIndex = function (column, index, value) {
    index = this.resolveValue(index);
    value = this.resolveValue(value);
    this.assigments.push(column + ' [' + index + '] = ' + value);
    return this;
};

/**
 * Resolves the parameters into a string fragment.
 * @return {String}
 */
Assignment.prototype.parameterize = function () {
    return [this.parameters, this.assigments.join(', ')];
};

module.exports = Assignment;
