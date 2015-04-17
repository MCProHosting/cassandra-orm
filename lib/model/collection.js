var Bluebird = require('bluebird');
var _ = require('lodash');

var Table = require('../cql/table');
var Column = require('../cql/column/basic');
var Model = require('./model');
var util = require('../util');
var cast = require('../cql/typecast/cast');

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
    this.props = { private: { getters: {}, setters: {} }, public: {} };
    this.middleware = {};
}

/**
 * Typecasts one value by its column or name.
 * @param  {String|Column} column
 * @param  {*}
 * @return {*}
 */
Collection.prototype.typecast = function (column, value) {
    if (typeof column === 'string') {
        for (var i = 0, l = this.columns.length; i < l; i++) {
            var col = this.table.columns[i];

            if (col.toString() === column) {
                return cast(col, value);
            }
        }
        throw new Error('Column ' + column + ' not found on table.');
    } else {
        return cast(column, value);
    }
};

/**
 * Sets the models columns.
 *
 * @param  {[]Column} columns
 * @return {Collection}
 */
Collection.prototype.columns = function (columns) {
    var self = this;
    columns.forEach(function (column) {
        // If it's not a collumn, we were probably chaining indexes
        // or other methods on. Expect there to be a nested column.
        if (!(column instanceof Column)) {
            // Throw an error if that expectation was wrong.
            if (!(column.column instanceof Column)) {
                throw new Error(
                    'You must either pass columns to the collection, ' +
                    'or instances that have a property column.'
                );
            }

            column = column.column;
        }

        self[util.toStudlyCase(column.getName())] = column;
        self.table.addColumn(column);
    });

    return this;
};

/**
 * Defines a "getter" function on the collection.
 *
 * @param  {String|Column}
 * @param  {Function}
 * @return {Collection}
 */
Collection.prototype.getter = function (column, fn) {
    this.props.private.getters[column.toString()] = fn;
    return this;
};

/**
 * Defines a "setter" function on the collection.
 *
 * @param  {String|Column}
 * @param  {Function}
 * @return {Collection}
 */
Collection.prototype.setter = function (column, fn) {
    this.props.private.setters[column.toString()] = fn;
    return this;
};

/**
 * Starts a select query on the collection.
 * @return {SelectQuery}
 */
Collection.prototype.select = function () {
    var self = this;
    var query = this.connection.select();
    var oldExecute = query.execute;

    query.execute = function () {
        return oldExecute
            .apply(query, arguments)
            .then(function (results) {
                var records;
                if (results.rows) {
                    records = results.rows.map(function (record) {
                        return self.new().sync(record);
                    });
                }

                return _.extend(records, results);
            });
    };

    return query.from(this.table.getName());
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
 * Truncates data in the collection's table.
 * @return {Promise}
 */
Collection.prototype.truncate = function () {
    return this.connection.truncate().table(this.table.getName());
};

/**
 * Checks out a new Model from the collection.
 *
 * @param  {Object=} attributes
 * @return {Model}
 */
Collection.prototype.new = function (attributes) {
    return new Model(this, attributes, this.props);
};

/**
 * Adds a new property to be registered on the object.
 * @param {String} name
 * @param {*} value
 * @param {String=public} accessibility
 * @return {Collection}
 */
Collection.prototype.define = function (name, value, accessiblity) {
    this.props[accessiblity || 'public'][name] = value;
    return this;
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
    var middleware = this.middleware[stack] || [];

    return new Bluebird(function (resolve, reject) {
        runStack(context, middleware, resolve, reject);
    });
};

/**
 * Helper function to run a middleware stack.
 *
 * @param  {[]Function} middleware
 * @param  {Object} context
 * @param  {Function} resolve
 * @param  {Function} reject
 */
function runStack (context, middleware, resolve, reject, err) {
    if (err) {
        return reject(err);
    }
    if (middleware.length === 0) {
        return resolve();
    }

    return middleware[0].call(context, function (err) {
        runStack(context, middleware.slice(1), resolve, reject, err);
    });
}

module.exports = Collection;
