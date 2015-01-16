var util = require('../../util');

/**
 * Represents a tuple of terms for Cassandra.
 */
function TermTuple () {
    this.terms = new Array(arguments.length);
    for (var i = 0, l = arguments.length; i < l; i++) {
        this.terms[i] = arguments[i];
    }
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

    for (var i = 0, l = this.terms.length; i < l; i++) {
        var term = this.terms[i];

        // If the term is null or undefined, insert NULL.
        // Loose comparison intentional.
        if (term == null) { // jshint ignore:line
            newTerms.push('NULL');
        }
        // If we have a nested construct, parameterize it in turn
        else if (typeof term.parameterize === 'function') {
            var out = term.parameterize();
            output = output.concat(out[0]);
            newTerms.push(out[1]);
        }
        // Insert raw things in a raw way!
        else if (util.isRaw(term)) {
            newTerms.push(term);
        }
        // Otherwise just parameterize basic terms.
        else {
            output.push(term);
            newTerms.push('?');
        }
    }

    return [output, new TermTuple().setTerms(newTerms).toString()];
};

module.exports = TermTuple;
