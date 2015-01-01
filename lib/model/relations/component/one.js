var Base = require('./base');

function One () {
    Base.apply(this, arguments);
}

One.prototype = new Base();

One.prototype.detach
One.prototype.attach = function (model) {
    throw new Error(
        'You cannot attach or detach one-to-one relationships. ' +
        'Please make changes explicitly.'
    );
};

/**
 * Returns the value of the related column on the model.
 * @return {*}
 */
One.prototype.getRelation = function () {
    if (typeof this.otherModel === 'undefined') {
        return undefined;
    } else {
        return this.model[this.column];
    }
};
