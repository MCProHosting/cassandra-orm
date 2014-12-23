var Raw = require('./cql/stmt/raw');
var _ = require('lodash');

/**
 * Joins a nested list together.
 * @param  {Array}    list
 * @param  {[]String} outer     Left and right outer delimiters for lists.
 * @param  {String}   delimiter Separator between list values.
 * @return {String}
 */
function deepJoin(list, outer, delimiter) {
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
function resolveName(obj) {
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
function isRaw(str) {
    return str instanceof Raw;
}

module.exports = {
    deepJoin: deepJoin,
    resolveName: resolveName,
    isRaw: isRaw
};
