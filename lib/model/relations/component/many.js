var _ = require('lodash');

function Many (thisModel, thisColumn, otherModel, otherColumn) {
    this.thisModel = thisModel;
    this.thisColumn = thisColumn;
    this.otherModel = otherModel;
    this.otherColumn = otherColumn;

    thisModel[thisColumn] = [];
}

/**
 * Returns the model's position in the collection.
 * @param  {Model} model
 * @return {Number}
 */
Many.prototype.indexOf = function (model) {
    var col = this.thisModel[this.thisColumn];
    if (var i = 0, l = col.length; i < l; i++) {
        if (col[this.otherColumn] === model[this.otherColumn]) {
            return i;
        }
    }

    return -1;
};

/**
 * Attaches a model to the relation.
 * @param  {Model} model
 */
Many.prototype.attach = function (model) {
    model.def('attach', this.attach.bind(this));
    model.def('detach', this.detach.bind(this));

    if (this.indexOf(model) === -1) {
        model[this.otherColumn] = this.thisModel[this.thisColumn];
        this.thisModel[this.thisColumn].push(model);
    }

    return this;
};

/**
 * Detaches a model to the relation.
 * @param  {Model} model
 */
Many.prototype.detach = function (model) {
    var index = this.indexOf(model);
    if (index !== -1) {
        this.thisModel[this.thisColumn].splice(index, 1);
    }

    return this;
};

/**
 * Returns the value of the related column on the model.
 * @return {*}
 */
Many.prototype.getRelation = function () {
    if (typeof this.otherModel === 'undefined') {
        return undefined;
    } else {
        return this.model[this.column];
    }
};
