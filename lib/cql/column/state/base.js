/**
 * Represents a "transitional" state that allows us to chain methods onto
 * a column to adjust how to queries.
 */
function QueryState (column) {
    if (column) {
        this.name = column.getName();
    }
    this.modify = {};
}

module.exports = QueryState;
