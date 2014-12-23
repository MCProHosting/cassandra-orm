var QueryState = require('./base');

/**
 * Marks ascending/descending column.
 */
function OrderState() {
    QueryState.apply(this, arguments);
}

OrderState.prototype = new QueryState();

/**
 * Sets the column to order descending.
 * @return {OrderState}
 */
OrderState.prototype.desc = function () {
    this.modify.direction = 'DESC';
    return this;
};

/**
 * Sets the column to order ascending.
 * @return {OrderState}
 */
OrderState.prototype.asc = function () {
    this.modify.direction = 'ASC';
    return this;
};

/**
 * Returns the column ordered in the direction.
 * @return {String}
 */
OrderState.prototype.toString = function () {
    return this.name + ' ' + this.modify.direction;
};

module.exports = OrderState;
