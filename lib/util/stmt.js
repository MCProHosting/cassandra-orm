var Raw = require('../cql/stmt/raw');
var _ = require('lodash');

module.exports = {};

/**
 * Joins a nested list together.
 * @param  {Array}    list
 * @param  {[]String} outer     Left and right outer delimiters for lists.
 * @param  {String}   delimiter Separator between list values.
 * @return {String}
 */
module.exports.deepJoin = function (list, outer, delimiter) {
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
};

/**
 * Resolves the name of the table/column/querystate.
 * @param  {*} obj
 * @return {String}
 */
module.exports.resolveName = function (obj) {
    if (typeof obj.getName === 'function') {
        return obj.getName();
    } else {
        return obj;
    }
};

/**
 * Returns if the "str" is raw CQL.
 * @param  {String|Object}  str
 * @return {Boolean}
 */
module.exports.isRaw = function (str) {
    return str instanceof Raw;
};
