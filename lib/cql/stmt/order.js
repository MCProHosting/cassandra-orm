function Order () {
    this.rules = [];
}

/**
 * Adds an ordering rule. Takes an OrderState, Column, or RawString as the
 * first argument.
 *
 * @param  {OrderState|Column|Raw} column
 * @param  {String=} direction
 * @return {Order}
 */
Order.prototype.by = function (column, direction) {
    var stmt = column.toString() + ' ' + (direction || '').toUpperCase();
    this.rules.push(stmt.trim());

    return this;
};

/**
 * Joins the ordering rules into a comma-delimited string.
 * @return {String}
 */
Order.prototype.toString = function () {
    return this.rules.join(', ');
};

module.exports = Order;
