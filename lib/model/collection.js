var Bluebird = require('bluebird');
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
    this.middleware = {};
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

/**
 * Adds a middleware to the specified stack.
 * @param  {String|[]String} stack
 * @param  {Function} handler
 * @return {Collection}
 */
Collection.prototype.use = function (stack, handler) {
    // If it's an array, loop it over.
    if (Array.isArray(stack)) {
        for (var i = 0, l = stack.length; i < l; i++) {
            this.use(stack[i], handler);
        }
        return;
    }

    var middleware = this.middleware[stack];
    if (typeof middleware === 'undefined') {
        middleware = this.middleware[stack] = [];
    }

    middleware.push(handler);
};

/**
 * Runs the middleware stack, calling "then" when it's complete.
 *
 * @param  {String} stack
 * @oaram  {*} context
 * @param  {Function} then
 * @return {Promise}
 */
Collection.prototype.run = function (stack, context) {
    var self = this;

    return new Bluebird(function (resolve, reject) {
        var middleware = self.middleware[stack] || [];
        var index = 0;

        // Recursive function that, on ever call, runs the next middleware,
        // or the "then" function if we reached the end of the chain.
        function runMiddleware (err) {
            if (err) {
                reject(err);
            } else if (index < middleware.length) {
                middleware[index++].call(context, runMiddleware);
            } else {
                resolve();
            }
        }

        runMiddleware();
    });
};

module.exports = Collection;
