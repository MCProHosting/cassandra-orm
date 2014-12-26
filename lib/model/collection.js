var Table = require('../cql/table');
var util = require('../util');
var Model = require('./model');

/**
 * Represents a "table" in the database. Allows you to perform operations
 * against the whole of the database set.
 *
 * @param {Connection} connection
 * @param {String} name
 */
function Collection (connection, name) {
    this.connection = connection;
    this.name = name;
    this.table = new Table(util.toSnakeCase(name), connection);
    this.props = {};
}

/**
 * Sets the models columns.
 *
 * @param  {[]Column} columns
 * @return {Collection}
 */
Collection.prototype.columns = function (columns) {
    columns.forEach(this.table.addColumn.bind(this.table));
    return this;
};

/**
 * Starts a select query on the collection.
 * @return {SelectQuery}
 */
Collection.prototype.select = function () {
    return this.connection.select().from(this.table.getName());
};

/**
 * Starts an insert query on the collection.
 * @return {InsertQuery}
 */
Collection.prototype.insert = function () {
    return this.connection.insert().into(this.table.getName());
};

/**
 * Starts an delete query on the collection.
 * @return {DeleteQuery}
 */
Collection.prototype.delete = function () {
    return this.connection.delete().from(this.table.getName());
};

/**
 * Starts an update query on the collection.
 * @return {UpdateQuery}
 */
Collection.prototype.update = function () {
    return this.connection.update().table(this.table.getName());
};

/**
 * Checks out a new Model from the collection.
 * @param  {Object=} attributes
 * @return {Model}
 */
Collection.prototype.new = function (attributes) {
    var model = new Model(this, attributes);
    for (var key in this.props) {
        model.def(key, this.props[key]);
    }

    return model;
};

/**
 * Adds a new property to be registered on the object.
 * @param {String} name
 * @param {*} value
 */
Collection.prototype.define = function (name, value) {
    this.props[name] = value;
};

module.exports = Collection;
