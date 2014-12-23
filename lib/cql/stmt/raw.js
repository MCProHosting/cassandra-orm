function Raw (text) {
    this.text = text;
}

Raw.prototype.toString = function () {
    return this.text;
};

module.exports = Raw;
