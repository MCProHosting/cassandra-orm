var QueryState = require('./base');

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
    this.modify.ttl = true;
    return this;
};

/**
 * Sets the query to get the count of the column.
 * @return {QueryState}
 */
SelectState.prototype.count = function () {
    this.modify.count = true;
    return this;
};

/**
 * Sets the query to get the count of the column.
 * @return {QueryState}
 */
SelectState.prototype.writeTime = function () {
    this.modify.writeTime = true;
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
 * Returns the parsed column name.
 * @return {String}
 */
SelectState.prototype.toString = function () {
    var output = this.name;
    if (this.modify.ttl) {
        output = 'TTL(' + output + ')';
    } else if (this.modify.count) {
        output = 'COUNT(' + output + ')';
    } else if (this.modify.writeTime) {
        output = 'WRITETIME(' + output + ')';
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
