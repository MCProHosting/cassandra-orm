var Bluebird = require('bluebird');
var _ = require('lodash');
var eq = require('deep-equal');

function Model (collection, attributes) {
    this.def('collection', collection);
    this.def('old', {});
    this.def('columns', collection.table.columns);
    this.def('isFromDb', false);

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
 * Updates the "old" and existing properties. Should be called after the
 * model is updated or read from the database.
 *
 * @param  {Object} attributes
 */
Model.prototype.sync = function (attributes) {
    this.old = _.cloneDeep(attributes);
    this.isFromDb = true;
    _.extend(this, attributes);
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
 * @param {Boolean} force
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
 * INSERTs the model into the database.
 *
 * @return {Promise}
 */
Model.prototype.createNew = function () {
    var properties = this.toObject();

    return this.collection.insert()
        .data(properties)
        .then((function () {
            this.sync(properties);
            return this;
        }).bind(this));
};

/**
 * UPDATEs a record in the database with the changed properties.
 *
 * @return {Promise}
 */
Model.prototype.updateExisting = function () {
    var diffQuery = someMagicDiff(this.collection.update(), this.old, this);

    return diffQuery
        .execute(diffQuery)
        .then((function () {
            return this;
        }).bind(this));
};

module.exports = Model;
