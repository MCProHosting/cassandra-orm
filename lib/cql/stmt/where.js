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
 * @param  {String|[]String} term
 * @return {String}
 */
Where.prototype.baseWhere = function (column, operation, term) {
    if (typeof operation === 'undefined') {
        // If we were passed a function in as the first value, run it
        // and add its terms to this statement.
        if (typeof column === 'function') {
            var where = new Where();
            column(where);
            this.statements.push(where.statements);
            this.parameters = this.parameters.concat(where.parameters);
            return;
        } else {
            this.statements.push(column.toString());
            return;
        }
    }

    column = this.resolveColumn(column);

    if (typeof term.parameterize === 'function') {
        // Parameterize terms using the function, if possible.
        //
        var output = term.parameterize();
        this.parameters = this.parameters.concat(output[0]);
        term = output[1].toString();
    } else if (!util.isRaw(term)) {
        // Or just do it straight up.
        this.parameters.push(term);
        term = '?';
    }

    this.statements.push([column, operation, term].join(' '));
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
    return [this.parameters, this.statements.map(resolveStatement).join(' ')];
};

/**
 * If the statment is an array, returns a comma-delimited list
 * surrounded by parenthesis. Otherwise, just returns it.
 * @param  {String|[]String} statement
 * @return {String}
 */
function resolveStatement (statement) {
    if (Array.isArray(statement)) {
        return '(' + statement.join(' ') + ')';
    } else {
        return statement;
    }
}


module.exports = Where;
