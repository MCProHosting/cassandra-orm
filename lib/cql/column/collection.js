var basic = require('./basic');
var _ = require('lodash');

/**
 * Represents a collection-type column in Cassandra. Example:
 *
 *  // Creates a new map of strings to integers.
 *  new CollectionColumn('high_scores', 'map', [c.String(), c.Int()])
 *
 * You can, of course, nest collections with multiple depth.
 *
 * @param {String} name          Name of the collection.
 * @param {String} colType       Type of the collection (list, map, set, tuple).
 * @param {[]Column} nestedTypes The types nested inside the collection. This
 *                               for lists and sets, this will be length 1.
 *                               For maps, it should be length of 2.
 */
function CollectionColumn (name, colType, nestedTypes) {
    basic.call(this, name);
    this.colType = colType;
    this.nestedTypes = nestedTypes;
}

_.extend(CollectionColumn.prototype, basic.prototype);

/**
 * Returns the Cassandra type string for the column.
 * @return {String}
 */
CollectionColumn.prototype.getType = function () {
    var nested = this.nestedTypes
        .map(function (type) {
            return type.getType();
        })
        .join(', ');

    var type = this.colType + '<' + nested + '>';

    // Tuples must be frozen as of Cassandra 2.1.
    if (this.colType === 'tuple') {
        type = 'frozen <' + type + '>';
    }

    return type;
};

module.exports = CollectionColumn;
