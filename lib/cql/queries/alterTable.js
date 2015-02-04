var Base = require('./base');
var Table = require('../Table');
var cson = require('../cson');

/**
 * An alter table query. Valid usage:
 *     - AlterTable().table('tbl').type('column', type) <OR>
 *       AlterTable().table('tbl').type(new Text('column'))
 *     - AlterTable().table('tbl').add('names', 'text') <OR>
 *       AlterTable().table('tbl').add(new Text('names'))
 *     - AlterTable().table('tbl').drop('column')
 *     - AlterTable().table('tbl').rename('oldname', 'newname')
 *     - AlterTable().table('tbl').setProperties({ ... })
 */
function AlterTable () {
    Base.apply(this, arguments);

    this.parts = {
        table: null,
        operation: []
    };
}

AlterTable.prototype = new Base();

/**
 * Sets the table the query is operating on.
 * @param  {Table} table
 * @return {AlterTable}
 */
AlterTable.prototype.table = function (table) {
    if (table instanceof Table) {
        this.parts.table = table.getName();
    } else {
        this.parts.table = table;
    }

    return this;
};

/**
 * Updates a table column type. Can take a column name and the
 * type to change to, or a column object from which it will extract
 * the name and the type to update to.
 *
 * @param  {String|Column} column
 * @param  {String} type
 * @return {AlterTable}
 */
AlterTable.prototype.type = function (column, type) {
    if (typeof type === 'undefined') {
        this.parts.operation = ['ALTER', column.getName(), 'TYPE', column.getType()];
    } else {
        this.parts.operation = ['ALTER', column, 'TYPE', type];
    }

    return this;
};

/**
 * Adds a new column.
 * @param {Column} column
 * @return {AlterTable}
 */
AlterTable.prototype.add = function (column, type) {
    if (typeof type === 'undefined') {
        this.parts.operation = ['ADD', column.getName(), column.getType()];
    } else {
        this.parts.operation = ['ADD', column, type];
    }

    return this;
};

/**
 * Removes a column from the table.
 * @param  {String|Column} column
 * @return {AlterTable}
 */
AlterTable.prototype.drop = function (column) {
    this.parts.operation = ['DROP', column];
    return this;
};

/**
 * Renames a column.
 * @param  {String} oldName
 * @param  {String} newName
 * @return {AlterTable}
 */
AlterTable.prototype.rename = function (oldName, newName) {
    this.parts.operation = ['RENAME', oldName, 'TO', newName];
    return this;
};

/**
 * Updates table properties.
 * @param {Object} props
 * @return {AlterTable}
 */
AlterTable.prototype.setProperties = function (props) {
    var operation = this.parts.operation = ['WITH'];

    Object.keys(props).forEach(function (key, index) {
        if (index > 0) {
            operation.push('AND');
        }
        operation.push(key + ' = ' + cson.encode(props[key]));
    });

    return this;
};

/**
 * Parameterizes the query, returning an array of parameters followed
 * by the string representation.
 *
 * @return {[Array, String]}
 */
AlterTable.prototype.parameterize = function () {
    var parts = ['ALTER TABLE', this.parts.table.toString()].concat(this.parts.operation);
    return [[], parts.join(' ') + ';'];
};

module.exports = AlterTable;
