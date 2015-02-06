var Bluebird = require('bluebird');
var eq = require('deep-equal');
var _ = require('lodash');

var diff = require('./diff');

function Model (collection, attributes, props) {
    this._def('_', _.extend({
        collection: collection,
        old: {},
        attributes: {},
        columns: collection.table.columns,
        isFromDb: false,
        accessored: []
    }, props.private));

    for (var key in props.public) {
        this._def(key, props.public[key]);
    }

    this.bindAccessors();
    _.extend(this, attributes);
}

/**
 * Binds setters and getters for model columns. We only add accessords
 * for columns
 */
Model.prototype.bindAccessors = function () {
    var properties = {};

    this._.accessored = _.union(_.keys(this._.getters), _.keys(this._.setters));

    _.forEach(this._.accessored, function (key) {
        var getter = this._.getters[key];
        var setter = this._.setters[key];

        properties[key] = {
            configurable: true,
            enumerable: true,
            get: function () {
                if (typeof getter === 'undefined') {
                    return this._.attributes[key];
                } else {
                    return getter.call(this, this._.attributes[key]);
                }
            },
            set: function (value) {
                if (typeof setter === 'undefined') {
                    this._.attributes[key] = value;
                } else {
                    this._.attributes[key] = setter.call(this, value);
                }
            }
        };
    }, this);

    if (this._.accessored.length > 0) {
        Object.defineProperties(this, properties);
    }
};

/**
 * Defines a new non-enumerable property on the model.
 *
 * @param {String}   name
 * @param {*} value
 */
Model.prototype._def = function (name, value) {
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
    this._.old = {};
    this._.isFromDb = false;
};

/**
 * Fixes the casing of a column name to match the model definition, since
 * Cassandra columns are case-insensitive but attributes are sensitive.
 * @param  {String} column
 * @return {String}
 */
Model.prototype.fixCasing = function (column) {
    for (var i = 0, l = this._.columns.length; i < l; i++) {
        var name = this._.columns[i].toString();
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
    this._.isFromDb = true;

    var self = this;
    Object.keys(attributes).forEach(function (key) {
        var value = attributes[key];
        var name = self.fixCasing(key);

        if (self._.accessored.indexOf(name) === -1) {
            self[name] = _.cloneDeep(value);
        }

        self._.attributes[name] = _.cloneDeep(value);
        self._.old[name] = _.cloneDeep(value);
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
    for (i = 0, l = this._.columns.length; i < l; i++) {
        var column = this._.columns[i].toString();
        var item = data[column];
        if (typeof item !== 'undefined') {
            this[column] = item;
        }
    }

    return this;
};

/**
 * Iterates over the model's columns, typecasting each one and updating
 * the "attributes" for columns without getters/setters.
 */
Model.prototype._fixAttributes = function () {
    for (var i = 0, l = this._.columns.length; i < l; i++) {
        var column = this._.columns[i];
        var name = column.getName();
        var value;

        if (this._.accessored.indexOf(name) !== -1) {
            value = this._.attributes[name];
            this._.attributes[name] = this._.collection.typecast(column, value);
        } else {
            value = this._.collection.typecast(column, this[name]);
            this._.attributes[name] = value;
            this[name] = value;
        }
    }
};

/**
 * Returns whether the property has changed since it was synced to the
 * database.
 * @param  {String}  property
 * @return {Boolean}
 */
Model.prototype.isDirty = function (property) {
    this._fixAttributes();

    return !eq(this._.attributes[property], this._.old[property]);
};

/**
 * Returns true if every property is synced with the db. False if any
 * are different.
 *
 * @return {Boolean}
 */
Model.prototype.isSynced = function () {
    for (var i = 0, l = this._.columns.length; i < l; i++) {
        if (this.isDirty(this._.columns[i].toString())) {
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
    this._fixAttributes();

    var output = {};
    for (var i = 0, l = this._.columns.length; i < l; i++) {
        var column = this._.columns[i].toString();
        if (typeof useGetters === 'undefined' || useGetters === true) {
            output[column] = this[column];
        } else {
            output[column] = this._.attributes[column];
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
 * @param {Object={}} options
 * @param {Boolean=false} force
 * @return {Promise}
 */
Model.prototype.save = function (options, force) {
    if (typeof options === 'boolean') {
        force = options;
        options = {};
    }

    if (!force && this.isSynced()) {
        return Bluebird.resolve(this);
    }

    this._fixAttributes();
    if (this._.isFromDb) {
        return this._updateExisting(options);
    } else {
        return this._createNew(options);
    }
};

/**
 * Deletes this model's record from the database.
 *
 * @param {Boolean=false} force
 * @return {Promise}
 */
Model.prototype.delete = wrapAround('beforeDelete', function (force) {
    if (!this._.isFromDb && !force) {
        return Bluebird.resolve();
    }

    return this._addWhereSelf(this._.collection.delete()).execute();
}, 'afterDelete');

/**
 * Applies an options object, calling methods (keys) with their
 * values (arrays).
 * @param  {Query} query
 * @param  {Object={}} options
 * @return {Query}
 */
Model.prototype._applyOptions = function (query, options) {
    options = options || {};

    for (var key in options) {
        var args = options[key];
        query[key].apply(query, Array.isArray(args) ? args : [args]);
    }

    return query;
};

/**
 * Adds a "where" to the query so that it targets only this model.
 * @param {BaseQuery} query
 * @return {BaseQuery}
 */
Model.prototype._addWhereSelf = function (query) {
    var keys = this._.collection.table.keys;
    var pks = keys.partition.concat(keys.compound);

    if (!pks.length) {
        throw new Error('A primary key is required on all models.');
    }

    for (var i = 0, l = pks.length; i < l; i++) {
        query.where(pks[i], '=', this._.old[pks[i].toString()]);
    }

    return query;
};

/**
 * INSERTs the model into the database.
 *
 * @return {Promise}
 */
Model.prototype._createNew = wrapAround('beforeCreate', function (options) {
    var properties = this.toObject(false);
    var self = this;

    return this._applyOptions(
        this._.collection.insert().data(properties),
        options
    ).then(function () {
        self.sync(properties);
        return self;
    });
}, 'afterCreate');

/**
 * UPDATEs a record in the database with the changed properties.
 *
 * @return {Promise}
 */
Model.prototype._updateExisting = wrapAround('beforeUpdate', function (options) {
    var query = this._addWhereSelf(this._.collection.update());
    var self = this;

    for (var i = 0, l = this._.columns.length; i < l; i++) {
        var column = this._.columns[i];
        var name = column.getName();

        diff(query, column, this._.old[name], this._.attributes[name]);
    }

    this._applyOptions(query, options);

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
        var args = arguments;

        return self._.collection
            .run(before, self)
            .then(function () {
                return fn.apply(self, args);
            })
            .then(function () {
                var resolved = Bluebird.resolve.apply(Bluebird, arguments);

                return self._.collection.run(after, self).then(function () {
                    return resolved;
                });
            });
    };
}

module.exports = Model;
