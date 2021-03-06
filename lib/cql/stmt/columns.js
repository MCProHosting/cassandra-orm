/**
 * Represents a collection of columns.
 * @param {Array=} columns
 */
function Columns (columns) {
    this._columns = columns || [];
}

/**
 * Sets the columns. Takes an array as its first argument, or columns as
 * a variadic arguments.
 * @param  {Array|String...} columns
 * @return {Columns}
 */
Columns.prototype.columns = function (columns) {
    if (Array.isArray(columns)) {
        this._columns = columns;
    } else {
        this._columns = new Array(arguments.length);
        for (var i = 0, l = arguments.length; i < l; i++) {
            this._columns[i] = arguments[i];
        }
    }

    return this;
};

/**
 * Returns a comma-delimited listing of columns
 */
Columns.prototype.toString = function () {
    return this._columns.join(', ');
};

module.exports = Columns;
