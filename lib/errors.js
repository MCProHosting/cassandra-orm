var util = require('util');
var _ = require('lodash');

var errors = module.exports = _.clone(require('cassandra-driver').errors);

function InvalidTypeError (column, expected, to) {
    Error.call(this);

    if (typeof column === 'string') {
        this.message = column;
    } else {
        this.message = 'Expect ' + column.getName() + ' to be one of: ' +
            expected.join(', ') + ', or ' + to + ' for coercion to a ' + to;
    }
}
util.inherits(InvalidTypeError, Error);

errors.InvalidType = InvalidTypeError;
