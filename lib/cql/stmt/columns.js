var util = require('../../util');

function Columns (columns) {
    this.columns = columns.map(util.resolveName);
}

/**
 * Returns a comma-delimited listing of columns
 */
Columns.prototype.toString = function () {
    return this.columns.join(', ');
};

module.exports = Columns;
