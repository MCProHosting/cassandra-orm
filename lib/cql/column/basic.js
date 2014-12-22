/**
 * Represents a column in a CQL table. Note that the name is not necessarily
 * required.
 *
 * @param {String} name Name of the column.
 * @param {String} type The type string of the table.
 */
function Column (name, type) {
    this.name = name;
    this.type = type;
    this.attrs = [];
}

/**
 * Returns the Cassandra type string for the column.
 * @return {String}
 */
Column.prototype.getType = function () {
    return this.type;
};

/**
 * Returns the column name.
 * @return {String}
 */
Column.prototype.getName = function () {
    return this.name;
};

/**
 * Adds a column attribute.
 * @param {String} attr
 * @return {Column}
 */
Column.prototype.addAttr = function (attr) {
    this.attrs.push(attr.toUpperCase());
    return this;
};

/**
 * Gets the column attributes.
 * @return {[]String}
 */
Column.prototype.getAttrs = function () {
    return this.attrs;
};

/**
 * Returns the "name + type" for use in CREATE TABLE.
 * @return {String}
 */
Column.prototype.getEntry = function () {
    return [this.getName(), this.getType()].concat(this.getAttrs()).join(' ');
};

module.exports = Column;
