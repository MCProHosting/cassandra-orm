var _ = require('lodash');
var eq = require('deep-equal');

function Model (collection, attributes) {
    this.def('collection', collection);
    this.def('old');
    this.def('keys');

    this.sync(attributes || {});
}

/**
 * Defines a new non-enumerable property on the model.
 *
 * @param {String}   name
 * @param {*} value
 */
Model.prototype.def = function (name, value) {
    Object.defineProperty(obj, name, {
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
    this.old = _.clone(attributes);
    this.keys = Object.keys(attributes);
    _.extend(this, attributes);
};

/**
 * Returns whether the property has changed since it was synced to the
 * database.
 * @param  {String}  property
 * @return {Boolean}
 */
Model.prototype.isDirty = function (property) {
    return eq(this[property], old[property]);
};

/**
 * Returns true if every property is synced with the db. False if any
 * are different.
 *
 * @return {Boolean}
 */
Model.prototype.isSynced = function () {
    for (var i = 0, l = this.keys.length; i < l; i++) {
        if (this.isDirty(this.keys[i])) {
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
    for (var i = 0, l = this.keys.length; i < l; i++) {
        output[this.keys[i]] = this[keys[i]];
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

module.exports = Model;
