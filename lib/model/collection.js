var _ = require('lodash');

var Table = require('../cql/table');
var Model = require('./model');
var util = require('../util');

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
    columns.forEach((function (column) {
        this[util.toStudlyCase(column.getName())] = column;
        this.table.addColumn(column);
    }).bind(this));
    return this;
};

/**
 * Starts a select query on the collection. It resolves
 * @return {SelectQuery}
 */
Collection.prototype.select = function () {
    var self = this;

    return util.wrap(this.connection.select(), 'execute')
        .chain('then', function (results) {
            var records;
            if (results.rows) {
                records = results.rows.map(function (record) {
                    return self.new().sync(record);
                });
            }

            return _.extend(records, results);
        })
        .getWrapped()
        .from(this.table.getName());
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
 *
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
