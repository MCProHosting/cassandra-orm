function Query () {

}

/**
 * Adds a part that implements parameterized() to the query.
 * @param {Array} params
 * @param {String} part
 * @param {String} prefix
 */
Query.prototype.addParameterized = function (params, part, prefix) {
    var out = this.parts[part].parameterize();
    if (out[1].length) {
        params.push.apply(params, out[0]);
        return prefix + out[1];
    } else {
        return '';
    }
};

/**
 * Adds the part with the prefix, if it has a non-zero length
 * @param {String} part
 * @param {String} prefix
 */
Query.prototype.addPart = function (part, prefix) {
    var str = this.parts[part].toString();
    if (str.length > 0) {
        return prefix + str;
    } else {
        return '';
    }
};

module.exports = Query;
