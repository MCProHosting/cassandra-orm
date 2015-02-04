var cson = require('../../cson');

function Index (column, name) {
    this.name = name;
    this.column = column;
    this.settings = { using: null, options: null };
}

/**
 * Sets the Java class to use for the index.
 * @param  {String} classname
 * @return {Index}
 */
Index.prototype.using = function (classname) {
    this.settings.using = classname;
    return this;
};

/**
 * Sets the index options.
 * @param  {Object} options
 * @return {Index}
 */
Index.prototype.options = function (options) {
    this.settings.options = options;
    return this;
};

/**
 * Returns a string representation of the index funciton.
 * @param  {String} table name of the table
 * @return {String}
 */
Index.prototype.toString = function (table) {
    var output = 'CREATE INDEX';
    // If we gave an index name, add that.
    if (this.name) {
        output += ' ' + this.name;
    }
    output += ' ON ' + table + ' (' + this.column.name + ')';

    if (this.settings.using) {
        output += ' USING \'' + this.settings.using + '\'';
    }
    if (this.settings.options) {
        output += ' WITH OPTIONS = ' + cson.encode(this.settings.options);
    }

    output += ';';

    return output;
};

module.exports = Index;
