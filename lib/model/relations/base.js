function Relation (leftModel, rightModel) {
    this.leftModel = leftModel;
    this.rightModel = rightModel;
}

/**
 * Sets the "leftModel" column.
 *
 * @param  {Column} column
 * @return {Relation}
 */
Relation.prototype.from = function (column) {
    this.left = column;
    return this;
};

/**
 * Sets the "rightModel" column, and triggers the "bind" event.
 *
 * @param  {Column} column
 * @return {Relation}
 */
Relation.prototype.to = function (column) {
    this.left = column;
    this.bind();
    return this;
};

/**
 * Binds the definitions to both models. Essentially finalizes the relation.
 */
Relation.prototype.bind = function () {
    return new Error('Bind not implemented');
};

module.exports = Relation;
