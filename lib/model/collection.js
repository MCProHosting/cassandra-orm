var Bluebird = require('bluebird');
var _ = require('lodash');

var Table = require('../cql/table');
var Model = require('./model');
var util = require('../util');

var Has = require('./relations/has');
// var HasMany = require('./relations/hasMany');
// var BelongsTo = require('./relations/belongsTo');

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
    this.plural = name + 's';
    this.table = new Table(util.toSnakeCase(name), connection);
    this.props = {};
    this.middleware = {};
    this.relations = [];

    this.with = [];
}

/**
 * Sets the collection's plural name.
 *
 * @param  {String} name
 * @return {Collection}
 */
Collection.prototype.plural = function (name) {
    this.plural = name;
    return this;
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
        self[util.toStudlyCase(column.getName())] = column;
        self.table.addColumn(column);
    });

    return this;
};

/**
 * Says we want to populate a model relation on the next SELECT.
 *
 * @param  {[]String|String} model
 * @return {Collection}
 */
Collection.prototype.with = function (collection) {
    if (!Array.isArray(collection)) {
        collection = [collection];
    }

    this.with = _.where(this.relations, function (relation) {
        return collection.indexOf(relation.name) !== -1;
    });
};

/**
 * Starts a select query on the collection. It resolves
 * @return {SelectQuery}
 */
Collection.prototype.select = function () {
    var self = this;
    // Get the relations we want to load.
    var populate = this.with;
    var todo = [];
    this.with = [];

    // Start a select query and replace the execute function with one
    // that populates models after returning.
    var query = this.connection.select();
    var oldExecute = query.execute;

    query.execute = function () {
        return oldExecute
            .apply(query, arguments)
            .then(function (results) {
                var records;
                // Turn the record rows into models;
                if (results.rows) {
                    records = results.rows.map(mapRec);
                }

                // Run all populations then return the results.
                return Bluebird.all(todo).then(function () {
                    return _.extend(records, results);
                });
            });
    };

    // Helper function to create a new model and pushes any populations
    // we want to do to the "todo" list.
    function mapRec (record) {
        var model = self.new().sync(record);
        for (var i = 0, l = populate.length; i < l; i++) {
            todo.push(model[populate[i]].populate());
        }

        return model;
    }

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
    var relations = this.relations;
    for (var i = 0, l = relations.length; i < l; i++) {
        relations[i].bind(model);
    }

    return model;
};

/**
 * Adds a new property to be registered on the object.
 * @param {String} name
 * @param {*} value
 * @return {Collection}
 */
Collection.prototype.define = function (name, value) {
    this.props[name] = value;
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
 * Creates a "has many" relation between two collections.
 * @param  {Collection}  model
 * @return {HasMany}
 */
Collection.prototype.hasMany = function (model) {
    var relation = HasMany(this, model);
    this.relations.push(relation);
    return relation;
};

/**
 * Creates a "belongs to" relation between two collections.
 * @param  {Collection}  model
 * @return {BelongsTo}
 */
Collection.prototype.belongsTo = function (model) {
    var relation = BelongsTo(this, model);
    this.relations.push(relation);
    return relation;
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
    var middleware = this.middleware[stack] || [];

    return new Bluebird(function (resolve, reject) {
        runStack(self, middleware, resolve, reject);
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
