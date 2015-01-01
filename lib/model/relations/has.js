var Base = require('./base');
var One = require('./component/one');

function HasMany () {
    Base.apply(this, arguments);
}

Has.prototype = new Base();

/**
 * Binds the definitions to both models. Essentially finalizes the relation.
 */
Has.prototype.bind = function (model) {
    model.relations.push(new One(model, this.left, this.right));
};

module.exports = Has;
