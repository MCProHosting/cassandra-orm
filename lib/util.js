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

module.exports = {
    deepJoin: deepJoin
};
