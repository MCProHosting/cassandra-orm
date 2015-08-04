var _ = require('lodash');

/**
 * Parses an object into CQL's simple, not-quite-JSON format.
 *
 * @param  {Object} obj
 * @return {String}
 */
function encode (obj) {
    if (String(obj).match(/^[0-9\.]*$/) !== null) {
        // Numeric items can be returned directly.
        return obj;
    } else if (typeof obj === 'string') {
        // Quote strings.
        return '\'' + obj + '\'';
    } else {
        // And turn objects into CSON.
        var output = '{ ';
        for (var key in obj) {
            output += '\'' + key + '\': \'' + obj[key] + '\' ';
        }
        output += '}';

        return output;
    }
}

/**
 * Decodes an object into CQL's format. This can be JSON for the "caching"
 * property, or the simplistic CSON for the compaction and compression
 * properties.
 *
 * @param  {String} obj
 * @return {Object}
 */
function decode(str) {
    if (str[0] === '\'') {
        // JSON-style is quoted in single quotes
        return JSON.parse(str.slice(1, -1));
    } else {
        // Otherwise, turn it into JSON.
        str = str.replace('"', '\"');
        str = str.replace('\'', '"');

        return JSON.parse(str);
    }
}


module.exports = {
    encode: encode,
    decode: decode
};
