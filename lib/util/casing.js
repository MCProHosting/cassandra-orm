module.exports = {};

/**
 * Capitalizes the first letter in a string.
 * @param  {String} str
 * @return {STring}
 */
var capFirst = module.exports.capFirst = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts a string from camelCase or StudlyCase to snake_case. Could use
 * regex for this, but handling Studly (probably the most common use for
 * model names...) is ugly. And this is faster too ;)
 *
 * @param {String} str
 * @return {String}
 */
var toSnakeCase = module.exports.toSnakeCase = function (str) {
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
};

/**
 * Converts a string from snake_case to camelCase.
 * @param  {String} str
 * @return {String}
 */
var toCamelCase = module.exports.toCamelCase = function (str) {
    return str.replace(/(_\w)/g, function (match) {
        return match[1].toUpperCase();
    });
};

/**
 * Converts a string from snake_case to StudlyCase.
 *
 * @param  {String} str
 * @return {String}
 */
var toStudlyCase = module.exports.toStudlyCase = function (str) {
    return capFirst(toCamelCase(str));
};
