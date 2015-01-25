var Bluebird = require('bluebird');
var eq = require('deep-equal');
var _ = require('lodash');

var diff = require('./diff');

function Model (collection, attributes, props) {
    this.def('collection', collection);
    this.def('old', {});
    this.def('attributes', {});
    this.def('columns', collection.table.columns);
    this.def('isFromDb', false);

    for (var key in props) {
        this.def(key, props[key]);
    }

    this.bindAccessors();
    _.extend(this, attributes);
}

/**
 * Binds setters and getters for model columns.
 */
Model.prototype.bindAccessors = function () {
    var self = this;
    this.columns.forEach(function (column) {
        var key = column.getName(), value;
        var getter = self.getters[key];
        var setter = self.setters[key];

        Object.defineProperty(self, key, {
            configurable: true,
            enumerable: true,
            get: function () {
                if (typeof getter === 'undefined') {
                    return self.attributes[key];
                } else {
                    return getter.call(self, self.attributes[key]);
                }
            },
            set: function (value) {
                if (typeof setter === 'undefined') {
                    self.attributes[key] = value;
                } else {
                    self.attributes[key] = setter.call(this, value);
                }
            }
        });
    });
};

/**
 * Defines a new non-enumerable property on the model.
 *
 * @param {String}   name
 * @param {*} value
 */
Model.prototype.def = function (name, value) {
    Object.defineProperty(this, name, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: value
    });
};

/**
 * Wipes the sync state and attributes. Mainly for testing ease, but meh,
 * you might find this useful too.
 */
Model.prototype.reset = function () {
    this.old = {};
    this.isFromDb = false;
};

/**
 * Fixes the casing of a column name to match the model definition, since
 * Cassandra columns are case-insensitive but attributes are sensitive.
 * @param  {String} column
 * @return {String}
 */
Model.prototype.fixCasing = function (column) {
    for (var i = 0, l = this.columns.length; i < l; i++) {
        var name = this.columns[i].toString();
        if (name.toLowerCase() === column.toLowerCase()) {
            return name;
        }
    }

    return column;
};

/**
 * Updates the "old" and existing properties. Should be called after the
 * model is updated or read from the database.
 *
 * @param  {Object} attributes
 * @return {Model}
 */
Model.prototype.sync = function (attributes) {
    this.isFromDb = true;

    var self = this;
    Object.keys(attributes).forEach(function (key) {
        var value = attributes[key];
        var name = self.fixCasing(key);

        self.attributes[name] = _.cloneDeep(value);
        self.old[name] = _.cloneDeep(value);
    });

    return this;
};

/**
 * Extends this model's data with anything passed in the arguments. Functions
 * in the same way to lodash's "extend".
 * @return {Model}
 */
Model.prototype.extend = function () {
    var args = new Array(arguments.length + 1);
    var data = args[0] = {};

    var i, l;
    for (i = 0, l = arguments.length; i < l; i++) {
        args[i + 1] = arguments[i];
    }

    // Compact all the arguments to our single "data" argument
    _.extend.apply(null, args);

    // Then apply those over this model.
    for (i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i].toString();
        var item = data[column];
        if (typeof item !== 'undefined') {
            this[column] = item;
        }
    }

    return this;
};

/**
 * Iterates over the model's columns, typecasting each one.
 */
Model.prototype.fixTypes = function () {
    for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i];
        var value = this.attributes[column.toString()];

        this.attributes[column.toString()] = this.collection.typecast(column, value);
    }
};

/**
 * Returns whether the property has changed since it was synced to the
 * database.
 * @param  {String}  property
 * @return {Boolean}
 */
Model.prototype.isDirty = function (property) {
    this.fixTypes();

    return !eq(this.attributes[property], this.old[property]);
};

/**
 * Returns true if every property is synced with the db. False if any
 * are different.
 *
 * @return {Boolean}
 */
Model.prototype.isSynced = function () {
    for (var i = 0, l = this.columns.length; i < l; i++) {
        if (this.isDirty(this.columns[i].toString())) {
            return false;
        }
    }

    return true;
};

/**
 * Converts the model to a plain object
 *
 * @param  {Boolean} useGetters
 * @return {Object}
 */
Model.prototype.toObject = function (useGetters) {
    this.fixTypes();

    var output = {};
    for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i].toString();
        if (typeof useGetters === 'undefined' || useGetters === true) {
            output[column] = this[column];
        } else {
            output[column] = this.attributes[column];
        }
    }

    return output;
};

/**
 * Converts the record to a JSON representation.
 *
 * @return {String}
 */
Model.prototype.toJson = function () {
    return JSON.stringify(this.toObject());
};

/**
 * Persists the model to the database.
 *
 * @param {Boolean=false} force
 * @return {Promise}
 */
Model.prototype.save = function (force) {
    if (!force && this.isSynced()) {
        return Bluebird.resolve(this);
    }

    this.fixTypes();
    if (this.isFromDb) {
        return this.updateExisting();
    } else {
        return this.createNew();
    }
};

/**
 * Deletes this model's record from the database.
 *
 * @param {Boolean=false} force
 * @return {Promise}
 */
Model.prototype.delete = wrapAround('beforeDelete', function (force) {
    if (!this.isFromDb && !force) {
        return Bluebird.resolve();
    }

    return this.addWhereSelf(this.collection.delete()).execute();
}, 'afterDelete');

/**
 * Adds a "where" to the query so that it targets only this model.
 * @param {BaseQuery} query
 * @return {BaseQuery}
 */
Model.prototype.addWhereSelf = function (query) {
    var keys = this.collection.table.keys;
    var pks = keys.partition.concat(keys.compound);

    if (!pks.length) {
        throw new Error('A primary key is required on all models.');
    }

    for (var i = 0, l = pks.length; i < l; i++) {
        query.where(pks[i], '=', this.old[pks[i].toString()]);
    }

    return query;
};

/**
 * INSERTs the model into the database.
 *
 * @return {Promise}
 */
Model.prototype.createNew = wrapAround('beforeCreate', function () {
    var properties = this.toObject(false);
    var self = this;

    return this.collection.insert()
        .data(properties)
        .then(function () {
            self.sync(properties);
            return self;
        });
}, 'afterCreate');

/**
 * UPDATEs a record in the database with the changed properties.
 *
 * @return {Promise}
 */
Model.prototype.updateExisting = wrapAround('beforeUpdate', function () {
    var query = this.addWhereSelf(this.collection.update());
    var self = this;

    for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i];
        var name = column.getName();

        diff(query, column, this.old[name], this.attributes[name]);
    }

    return query.then(function () {
        self.sync(self.toObject(false));
        return self;
    });
}, 'afterUpdate');

/**
 * Wraps the function so that the "before" and "after" middleware
 * is run "around" it.
 *
 * @param  {String}   before
 * @param  {Function} fn
 * @param  {String}   after
 * @return {Promise}
 */
function wrapAround (before, fn, after) {
    return function () {
        var self = this;
        return self.collection
            .run(before, self)
            .then(fn.bind(self))
            .then(function () {
                var resolved = Bluebird.resolve.apply(Bluebird, arguments);

                return self.collection.run(after, self).then(function () {
                    return resolved;
                });
            });
    };
}

module.exports = Model;
