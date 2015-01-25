var _ = require('lodash');
var InvalidTypeError = require('../../errors').InvalidType;
/**
 * Typecasts the single `value` to fit the type according to
 * http://www.datastax.com/documentation/developer/nodejs-driver/1.0/nodejs-driver/reference/nodejs2Cql3Datatypes.html
 *
 * @param  {*} value
 * @return {*}
 */
function castValue (type, value) {
    if (typeof value === 'undefined' || value === null) {
        return value;
    }

    switch (type) {
        case 'ascii':
        case 'text':
        case 'timeuuid':
        case 'uuid':
        case 'varchar':
            return '' + value;
        case 'bigint':
        case 'counter':
            return new cassandra.types.Long.fromString('' + value);
        case 'blob':
        case 'decimal':
        case 'inet':
        case 'varint':
            return Buffer.isBuffer(value) ? value : new Buffer(value);
        case 'boolean':
            return !!value;
        case 'double':
        case 'float':
            return parseFloat(value, 10);
        case 'int':
            return parseInt(value, 10);
        case 'timestamp':
            if (_.isDate(value)) {
                return value;
            } else if (typeof value === 'number') {
                return new Date(value);
            } else if (typeof value.toDate === 'function') {
                return value.toDate();
            } else {
                return NaN;
            }
        break;
        default:
            return value;

    }
}

/**
 * Tries to case the value to a type, throwing an error if it fails.
 * @param  {Column} Column
 * @param  {*}
 * @return {*}
 */
function castValueOrFail (column, type, value) {
    var out = castValue(type, value);
    if (_.isNaN(out)) {
        throw new InvalidTypeError(column.getName(), value);
    }

    return out;
}

/**
 * Casts all values in a collection.
 * @return {*}
 */
function castCollection (column, obj) {
    var nest = column.nestedTypes;
    var out;

    switch (column.colType) {
        case 'list':
        case 'set':
            // If the value isn't an array, throw an error.
            // Otherwise map over the values and cast them.
            if (!Array.isArray(obj)) {
                throw new InvalidTypeError(column.getName(). obj);
            } else {
                return obj.map(castValueOrFail.bind(null, column, nest[0]));
            }
        break;
        case 'map':
            // For maps (objects), loop over and cast both the object
            // keys and its values.
            out = {};
            for (var key in obj) {
                if (!obj.hasOwnProperty(key)) {
                    continue;
                }

                out[castValueOrFail(column, nest[0], key)] = castValueOrFail(column, nest[1], obj[key]);
            }
            return out;

        case 'tuple':
            // For tuples, make sure the column and target value is
            // of equal length, then go and cast each tuple item.
            if (!Array.isArray(obj) || obj.length !== nest.length) {
                throw new InvalidTypeError(column.getName(), obj);
            }
            out = new Array(nest.length);
            for (var i = 0, l = obj.length; i < l; i++) {
                out[i] = castValueOrFail(column, nest[i], obj[i]);
            }

            return out;

        default: return obj;
    }
}

/**
 * Generic function to case a value to match a column's type. Throws
 * an `invalid` error if the value doesn't fit.
 *
 * @param  {Column} column
 * @param  {*}
 * @return {*}
 */
function cast (column, value) {
    if (typeof value === 'undefined' || value === null) {
        return null;
    }

    if (column.isCollection) {
        return castCollection(column, value);
    } else {
        return castValueOrFail(column, column.getType(), value);
    }
}

module.exports = cast;
