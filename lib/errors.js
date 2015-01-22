var util = require('util');

function InvalidTypeError (column) {
    this.column = column;
}
util.inherits(InvalidTypeError, Error);

module.exports.InvalidType = InvalidTypeError;
