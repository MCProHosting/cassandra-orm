var Raw = require('./cql/stmt/raw');
var _ = require('lodash');

/**
 * Joins a nested list together.
 * @param  {Array}    list
 * @param  {[]String} outer     Left and right outer delimiters for lists.
 * @param  {String}   delimiter Separator between list values.
 * @return {String}
 */
function deepJoin (list, outer, delimiter) {
    var output = [];

    for (var i = 0, l = list.length; i < l; i++) {
        var item = list[i];
        if (_.isArray(item)) {
            output.push(deepJoin(item, outer, delimiter));
        } else {
            output.push(item);
        }
    }

    return outer[0] + output.join(delimiter) + outer[1];
}

/**
 * Resolves the name of the table/column/querystate.
 * @param  {*} obj
 * @return {String}
 */
function resolveName (obj) {
    if (typeof obj.getName === 'function') {
        return obj.getName();
    } else {
        return obj;
    }
}

/**
 * Returns if the "str" is raw CQL.
 * @param  {String|Object}  str
 * @return {Boolean}
 */
function isRaw (str) {
    return str instanceof Raw;
}

/**
 * Capitalizes the first letter in a string.
 * @param  {String} str
 * @return {STring}
 */
function capFirst (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Adds a proxy method to the object that calls through to the underlying
 * object, and returns the proxy.
 * @param  {Object} proxy
 * @param  {Object} obj
 * @param  {String} method
 */
function proxyMethod (proxy, obj, method) {
    proxy[method] = function () {
        obj[method].apply(obj, arguments);
        return proxy;
    };
}

/**
 * Converts a string from camelCase or StudlyCase to snake_case. Could use
 * regex for this, but handling Studly (probably the most common use for
 * model names...) is ugly. And this is faster too ;)
 *
 * @param {String} str
 * @return {String}
 */
function toSnakeCase (str) {
    var out = '';
    for (var i = 0, l = str.length; i < l; i++) {
        var chr = str.charAt(i);
        var lower = chr.toLowerCase();

        if (chr !== lower) {
            out += (i > 0 ? '_' : '') + lower;
        } else {
            out += chr;
        }
    }

    return out;
}

module.exports = {
    deepJoin: deepJoin,
    resolveName: resolveName,
    isRaw: isRaw,
    capFirst: capFirst,
    proxyMethod: proxyMethod,
    toSnakeCase: toSnakeCase
};
