var util = require('../../util');

/**
 * Base of a SQL query.
 * @param {Cassandra.Client} connection
 */
function Query (connection) {
    this.connection = connection;
}

/**
 * Adds a part that implements parameterized() to the query.
 * @param {Array} params
 * @param {String} part
 * @param {String} prefix
 */
Query.prototype.addParameterized = function (params, part, prefix) {
    var out = this.parts[part].parameterize();
    if (out[1].length) {
        params.push.apply(params, out[0]);
        return prefix + out[1];
    } else {
        return '';
    }
};

/**
 * Adds the part with the prefix, if it has a non-zero length
 * @param {String} part
 * @param {String} prefix
 */
Query.prototype.addPart = function (part, prefix) {
    var str = this.parts[part].toString();
    if (str.length > 0) {
        return prefix + str;
    } else {
        return '';
    }
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
Query.prototype.parameterize = function () {
    throw new Error('Parameterize must be implemented');
};

/**
 * Executes the built query.
 *
 * @param  {Options=} options
 * @return {Promise}
 */
Query.prototype.execute = function (options) {
    var query = this.parameterize();
    return this.connection.execute(query[1], query[0], options || {});
};

/**
 * Executes "eachRow" on the built query. todo: after 0.12 comes along
 * we should return a generator function.
 *
 * @param  {Options=} options
 * @param  {Function} callback
 * @return {Promise}
 */
Query.prototype.eachRow = function (options, callback) {
    var query = this.parameterize();
    return this.connection.eachRow(query[1], query[0], options || {}, callback);
};

/**
 * Executes, then returns the promise.
 *
 * @return {Promise}
 */
Query.prototype.then = function () {
    var promise = this.execute();
    promise.then.apply(promise, arguments);
};

/**
 * Executes, then returns the promise.
 *
 * @return {Promise}
 */
Query.prototype.catch = function () {
    var promise = this.execute();
    promise.catch.apply(promise, arguments);
};

module.exports = Query;
