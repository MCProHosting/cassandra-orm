var _ = require('lodash');
var InvalidTypeError = require('../../errors').InvalidType;
var Types = require('cassandra-driver').types;

/**
 * Certain types can be encoded as string or buffers, and have a
 * standard fromString and constructor methods.
 *
 * @param  {Column} column
 * @param  {*} value
 * @param  {Function} cls
 * @return {Object}
 */
function handleBufferType (column, value, cls) {
    if (value instanceof cls) {
        return value;
    } else if (typeof value === 'string') {
        return cls.fromString(value);
    } else if (Buffer.isBuffer(value)) {
        return new cls(value);
    } else {
        throw new InvalidTypeError(column, ['string', 'buffer'], 'uuid');
    }
}

/**
 * Attempts to parse a number column.
 * @param  {Column} column
 * @param  {*} value
 * @param  {Boolean} decimal
 * @return {Number}
 */
function parseNumber(column, value, decimal) {
    var parsed = value;
    if (typeof value !== 'number') {
        parsed = decimal ? parseFloat(value, 10) : parseInt(value, 10);
    } else if (!decimal) {
        parsed = Math.floor(parsed);
    }

    if (isNaN(parsed) || !isFinite(value)) {
        throw new InvalidTypeError(column, ['string'], 'number');
    }

    return parsed;
}

/**
 * Typecasts the single `value` to fit the type according to
 * http://www.datastax.com/documentation/developer/nodejs-driver/1.0/nodejs-driver/reference/nodejs2Cql3DataTypes.html
 *
 * @param  {Column} column
 * @param  {*} value
 * @return {*}
 */
function castValue (column, type, value) {
    if (typeof value === 'undefined' || value === null) {
        return value;
    }

    switch (type) {
        case 'timeuuid':
            return handleBufferType(column, value, Types.Uuid);
        case 'uuid':
            return handleBufferType(column, value, Types.TimeUuid);
        case 'ascii':
        case 'text':
        case 'varchar':
            return String(value);
        case 'bigint':
        case 'counter':
            if (value instanceof Types.Long) {
                return value;
            } else {
                return parseNumber(column, value, true);
            }
        case 'decimal':
            if (value instanceof Types.BigDecimal) {
                return value;
            } if (typeof value === 'number') {
                return Types.BigDecimal.fromBuffer(value);
            } else if (typeof value === 'string') {
                return Types.BigDecimal.fromString(value);
            } else if (Buffer.isBuffer(value)) {
                return Types.BigDecimal.fromNumber(value);
            } else {
                throw new InvalidTypeError(column, ['string', 'number',
                    'buffer'], 'decimal');
            }
        case 'inet':
            if (value instanceof Types.InetAddress) {
                return value;
            } else if (typeof value === 'string') {
                return Types.InetAddress.fromString(value);
            } else if (Buffer.isBuffer(value)) {
                return new Types.InetAddress(value);
            } else {
                throw new InvalidTypeError(column, ['string', 'buffer'], 'InetAddress');
            }
        case 'varint':
            if (value instanceof Types.Integer) {
                return value;
            } else if (typeof value === 'number') {
                return Types.Integer.fromNumber(value);
            } else if (typeof value === 'string') {
                return Types.Integer.fromString(value);
            } else if (Buffer.isBuffer(value)) {
                return Types.Integer.fromBuffer(value);
            } else {
                throw new InvalidTypeError(column, ['number', 'string', 'buffer'], 'Integer');
            }
        case 'blob':
            return Buffer.isBuffer(value) ? value : new Buffer(value);
        case 'boolean':
            return !!value;
        case 'int':
            return parseNumber(column, value, false);
        case 'double':
        case 'float':
            return parseNumber(column, value, true);
        case 'timestamp':
            if (value instanceof Date) {
                return value;
            } else if (typeof value === 'number') {
                return new Date(value);
            } else if (typeof value.toDate === 'function') {
                return value.toDate();
            } else {
                throw new InvalidTypeError(column, ['number', 'function',
                    'object with .toDate()'], 'date');
            }
        case 'list':
        case 'set':
            // If the value isn't an array, throw an error.
            // Otherwise map over the values and cast them.
            if (!Array.isArray(value)) {
                throw new InvalidTypeError(column, ['array'], column.colType);
            } else {
                return value.map(castValue.bind(null, column, column.nestedTypes[0]));
            }
        case 'map':
            // For maps (objects), loop over and cast both the object
            // keys and its values.
            out = {};
            for (var key in value) {
                if (!value.hasOwnProperty(key)) {
                    continue;
                }

                out[castValue(column, column.nestedTypes[0], key)] =
                    castValue(column, column.nestedTypes[1], value[key]);
            }
            return out;

        case 'tuple':
            var nest = column.nestedTypes;

            // For tuples, make sure the column and target value is
            // of equal length, then go and cast each tuple item.
            if (!Array.isArray(value)) {
                throw new InvalidTypeError(column, ['array'], column.colType);
            } else if (value.length !== nest.length) {
                throw new InvalidTypeError('Expected tuple for ' + column.getName() +
                    ' to be of length ' + nest.length + ', but it was ' + value.length);
            }
            out = new Array(nest.length);
            for (var i = 0, l = value.length; i < l; i++) {
                out[i] = castValue(column, nest[i], value[i]);
            }

            return out;
        default:
            return value;

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

    return castValue(column, column.type, value);
}

module.exports = cast;
