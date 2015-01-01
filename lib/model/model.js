var Bluebird = require('bluebird');
var eq = require('deep-equal');
var _ = require('lodash');

var diff = require('./diff');

function Model (collection, attributes) {
    this.def('collection', collection);
    this.def('old', {});
    this.def('columns', collection.table.columns);
    this.def('isFromDb', false);
    this.def('relations', []);

    _.extend(this, attributes);
}

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
 * Updates the "old" and existing properties. Should be called after the
 * model is updated or read from the database.
 *
 * @param  {Object} attributes
 * @return {Model}
 */
Model.prototype.sync = function (attributes) {
    this.old = _.cloneDeep(attributes);
    this.isFromDb = true;
    _.extend(this, attributes);

    var relations = this.relations;
    for (var i = 0, l = relations.length; i < l; i++) {
        this.relations[i].sync();
    }

    return this;
};

/**
 * Returns whether the property has changed since it was synced to the
 * database.
 * @param  {String}  property
 * @return {Boolean}
 */
Model.prototype.isDirty = function (property) {
    return !eq(this[property], this.old[property]);
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
 * @return {Object}
 */
Model.prototype.toObject = function () {
    var output = {};
    for (var i = 0, l = this.columns.length; i < l; i++) {
        var column = this.columns[i].toString();
        output[column] = this[column];
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
    var pk = this.collection.table.keys.partition[0];

    if (!pk) {
        throw new Error('A primary key is required on all models.');
    }

    return query.where(pk, '=', this.old[pk]);
};

/**
 * INSERTs the model into the database.
 *
 * @return {Promise}
 */
Model.prototype.createNew = wrapAround('beforeCreate',function () {
    var properties = this.toObject();
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
        diff(query, column, this.old[name], this[name]);
    }

    return query.then(function () {
        self.sync(self.toObject());
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
                return self.collection.run(after, self);
            });
    };
}

module.exports = Model;
