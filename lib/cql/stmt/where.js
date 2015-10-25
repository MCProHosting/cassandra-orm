var _ = require('lodash');
var util = require('../../util');

function Where () {
    this.statements = [];
    this.parameters = [];
}

/**
 * [resolveColumn description]
 * @param  {[type]} column [description]
 * @return {[type]}        [description]
 */
Where.prototype.resolveColumn = function (column) {
    // If the columns is a list, join into a column list.
    if (Array.isArray(column)) {
        return '(' + column.join(', ') + ')';
    } else {
        return column.toString();
    }
};

/**
 * Adds a where clause to the table, which takes the following forms:
 *
 * column_name op term
 *  | ( column_name, column_name, ... ) op term-tuple
 *  | column_name IN ( term, ( term ... ) )
 *  | ( column_name, column_name, ... ) IN ( term-tuple, ( term-tuple ... ) )
 *
 * @param  {[]Column|Column} column
 * @param  {String} operation
 * @param  {String|[]String} [term]
 * @return {String}
 */
Where.prototype.baseWhere = function (column, operator, term) {
    if (term === undefined) {
        term = operator;
        operator = '=';
    }

    column = this.resolveColumn(column);

    if (typeof term.parameterize === 'function') {
        // Parameterize terms using the function, if possible.
        var output = term.parameterize();
        this.parameters = this.parameters.concat(output.parameters);
        term = output.query;
    } else if (!util.isRaw(term)) {
        // Or just do it straight up.
        this.parameters.push({ key: column, value: term });
        term = '?';
    }

    this.statements.push([column, operator, term].join(' '));
};

/**
 * Adds an "AND" statement to the where.
 * @see resolveStatement for args
 * @return {Where}
 */
Where.prototype.where =
Where.prototype.andWhere = function () {
    if (this.statements.length > 0) {
        this.statements.push('AND');
    }
    this.baseWhere.apply(this, arguments);
    return this;
};

/**
 * Adds a "WHERE" statement to the where.
 * @see resolveStatement for args
 * @return {Where}
 */
Where.prototype.orWhere = function () {
    if (this.statements.length > 0) {
        this.statements.push('OR');
    }
    this.baseWhere.apply(this, arguments);
    return this;
};

/**
 * Resolves the WHERE into a string fragment.
 * @return {String}
 */
Where.prototype.parameterize = function () {
    return {
        parameters: this.parameters,
        query: this.statements.join(' ')
    };
};

module.exports = Where;
