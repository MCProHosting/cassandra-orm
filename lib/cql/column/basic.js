/**
 * Represents a column in a CQL table. Note that the name is not necessarily
 * required.
 *
 * @param {String} name Name of the column.
 * @param {String} type The type string of the table.
 */
function Column (name, type) {
    this.name = name;
    this.type = type;
    this.attrs = [];
    this.isKey = { partition: false, compound: false };
}

/**
 * Sets the column to be a partition key.
 * @return {Column}
 */
Column.prototype.partitionKey = function () {
    this.isKey.partition = true;
    return this;
};

/**
 * Sets the column to be a compound key.
 * @return {Column}
 */
Column.prototype.compoundKey = function () {
    this.isKey.compound = true;
    return this;
};

/**
 * Returns the Cassandra type string for the column.
 * @return {String}
 */
Column.prototype.getType = function () {
    return this.type;
};

/**
 * Returns the column name.
 * @return {String}
 */
Column.prototype.toString =
Column.prototype.getName = function () {
    return this.name;
};

/**
 * Adds a column attribute.
 * @param {String} attr
 * @return {Column}
 */
Column.prototype.addAttr = function (attr) {
    this.attrs.push(attr.toUpperCase());
    return this;
};

/**
 * Gets the column attributes.
 * @return {[]String}
 */
Column.prototype.getAttrs = function () {
    return this.attrs;
};

/**
 * Returns the "name + type" for use in CREATE TABLE.
 * @return {String}
 */
Column.prototype.getEntry = function () {
    return [this.getName(), this.getType()].concat(this.getAttrs()).join(' ');
};

var states = [
    require('./state/select'),
    require('./state/order')
];

// Bind all the methods on the state so that, when called, they'll instantiate
// a new state and run the requested method.
states.forEach(function (State) {
    for (var key in State.prototype) {
        // Don't overwrite the column's own states.
        if (typeof Column.prototype[key] !== 'undefined') {
            continue;
        }

        Column.prototype[key] = bindState(State, key);
    }
});

function bindState (State, key) {
    return function () {
        var state = new State(this);
        return state[key].apply(state, arguments);
    };
}

module.exports = Column;
