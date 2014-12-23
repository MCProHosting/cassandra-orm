function Conditionals () {
    this.statments = {};
}

/**
 * Adds a statement to the conditional.
 * @param  {String|Column} key
 * @param  {*} value
 * @return {Conditionals}
 */
Conditionals.prototype.when = function (key, value) {
    this.statments[key] = value;
    return this;
};

/**
 * Resolves the conditionals into a string fragment.
 * @return {String}
 */
Conditionals.prototype.parameterize = function () {
    var params = [];
    var output = '';
    for (var key in this.statments) {
        if (output.length > 0) {
            output += ' AND ';
        }

        output += key + ' = ?';
        params.push(this.statments[key]);
    }
    return [params, output];
};

module.exports = Conditionals;
