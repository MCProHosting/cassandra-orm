/**
 * Represents a collection of columns.
 * @param {Array=} columns
 */
function Columns (columns) {
    this._columns = columns || [];
}

/**
 * Returns the column at the index.
 * @param  {Number} index
 * @return {String}
 */
Columns.prototype.get = function (index) {
    return this._columns[index];
};

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
