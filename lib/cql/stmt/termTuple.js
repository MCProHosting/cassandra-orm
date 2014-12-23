var util = require('../../util');

/**
 * Represents a tuple of terms for Cassandra.
 */
function TermTuple () {
    this.terms = [].slice.call(arguments);
}

/**
 * SEts an array of terms in the tuple.
 * @param {[]*} terms
 * @return {TermTuple}
 */
TermTuple.prototype.setTerms = function (terms) {
    this.terms = terms;
    return this;
};

/**
 * Joins the tuple into a comma-delimited list.
 * @return {String}
 */
TermTuple.prototype.toString = function () {
    return '(' + this.terms.join(', ') + ')';
};

/**
 * Returns a list of "pulled" values in the tuple and replaces
 * them with "?" for querying, the resulting string.
 *
 * @return {[Array, String]}
 */
TermTuple.prototype.parameterize = function () {
    var newTerms = [];
    var output = [];

    this.terms.forEach(function (term) {
        if (typeof term.parameterize === 'function') {
            var out = term.parameterize();
            output = output.concat(out[0]);
            newTerms.push(out[1]);
        } else if (util.isRaw(term)) {
            newTerms.push(term.text);
        } else {
            output.push(term);
            newTerms.push('?');
        }
    });

    return [output, new TermTuple().setTerms(newTerms)];
};

module.exports = TermTuple;
