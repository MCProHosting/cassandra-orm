function Options () {
    this.options = [];
}

/**
 * Adds a timestamp option to the options.
 * @param {Number} time
 * @return {Options}
 */
Options.prototype.timestamp = function (time) {
    this.options.push('TIMESTAMP ' + time);
    return this;
};

/**
 * Adds a ttl option to the options.
 * @param {Number} time
 * @return {Options}
 */
Options.prototype.ttl = function (time) {
    this.options.push('TTL ' + time);
    return this;
};

/**
 * Converts the options to a string suitable for injection into
 * a query.
 * @return {String}
 */
Options.prototype.toString = function () {
    return this.options.join(' AND ');
};

module.exports = Options;
