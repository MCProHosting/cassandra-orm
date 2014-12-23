function Columns (columns) {
    this.columns = columns.map(function (col) {
        return col.toString();
    });
}

/**
 * Returns a comma-delimited listing of columns
 */
Columns.prototype.toString = function () {
    return this.columns.join(', ');
};

module.exports = Columns;
