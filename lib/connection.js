var cassandra = require('cassandra-driver');
var Bluebird = require('bluebird');
var _ = require('lodash');
var util = require('./util');

var BaseQuery = require('./cql/queries/base');
var types = require('./cql/types');
var builders = require('./cql/builders');

var Collection = require('./model/collection');

/**
 * Represents a Cassandra database connection. This is the primary means
 * of interacting with the ORM.
 *
 * @param {Object=} options If passed, we'll connect immediately.
 */
function Connection (options) {
    if (options) {
        this.connect(options);
    }

    // Add types in
    _.extend(this, types);
    // And builder methods
    _.extend(this, builders);
}


/**
 * Connects to the Cassandra database, binding client methods as needed.
 * @param  {Object} options
 * @return {Connection}
 */
Connection.prototype.connect = function (options) {
    var client = this.client = new cassandra.Client(options);
    // Promisify batch function
    client.batchAsync = Bluebird.promisify(client.batch, client);
    client.executeAsync = Bluebird.promisify(client.execute, client);

    // Promisify and bind functions that take a normal callback.
    this.shutdown = client.shutdownAsync = Bluebird.promisify(client.shutdown, client);
    this.connect = client.connectAsync = Bluebird.promisify(client.connect, client);

    // Bind client functions that don't need callbacks.
    var self = this;
    ['getReplicas', 'stream', 'eachRow'].forEach(function (method) {
        util.proxyMethod(self, 'client.' + method);
    });
};

/**
 * Batch runs many queries at once. Takes an array of queries, query strings,
 * or objects to be passed directory into the Cassandra driver.
 *
 * @param  {[]BaseQuery|[]String|[]Array} queries
 * @param  {Options=} options
 * @return {Promise}
 */
Connection.prototype.batch = function (queries, options) {
    return this.client.batchAsync(queries.map(function (query) {
        // Pass raw strings right in
        if (_.isString(query)) {
            return { query: query, params: [] };
        }
        // Parameterize queries
        else if (query instanceof BaseQuery) {
            var params = query.parameterize();
            return { query: params[1], params: params[0] };
        }
        // Or just pass anything we don't know right in.
        else {
            return query;
        }
    }), options || {});
};

/**
 * Executes a CQL query.
 * @param  {String} stmt
 * @param  {Array=} params
 * @param  {Object=} options
 * @return {Promise}
 */
Connection.prototype.execute = function (stmt, params, options) {
    // Statements should be prepared by default.
    _.defaults(typeof options === 'undefined' ? params : options, { prepare: true });

    return this.client.executeAsync(stmt, params, options);
};

/**
 * Creates and returns a new collection on the connection.
 * @param {String} name
 * @return {Model}
 */
Connection.prototype.Collection =
Connection.prototype.Model = function (name) {
    return new Collection(this, name);
};

module.exports = Connection;
