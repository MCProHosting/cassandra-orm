var promiseMethods = ['then', 'spread', 'catch', 'error', 'finally'];

function Wrapper () {
    this._obj = null;
    this._chain = [];
}

/**
 * Adds a chained promise method to be run after the wrapped object's
 * method and before we return the completed promise.
 * @param {String} method
 * @param {*...} args
 * @return {Wrapper}
 */
Wrapper.prototype.chain = function () {
    this._chain.push([].slice.call(arguments));
    return this;
};

/**
 * Wraps an object in promise methods. Takes an object, and when a promise
 * method is called on that object we'll run fn and return fn's output.
 *
 * @param  {Object}   obj
 * @param  {Function} fn
 * @param  {*...} args
 * @return {Wrapper}
 */
Wrapper.prototype.obj = function (obj) {
    this._obj = obj;
    this.fn = [].slice.call(arguments, 1);

    for (var i = 0, l = promiseMethods.length; i < l; i++) {
        var method = promiseMethods[i];
        obj[method] = this.runMethod(method);
    }

    return this;
};

/**
 * Generator function to resolve the wrapped promise.
 * @param  {String} promiseMethod
 * @return {Function}
 */
Wrapper.prototype.runMethod = function (promiseMethod) {
    // Get the method we want to run to create the promise initially.
    var method = this.fn[0];
    var args = this.fn.slice(1);

    return (function () {
        // Run it...
        var promise = this._obj[method].apply(this._obj, args);

        // Then run anything we want to chain on top of it.
        for (var i = 0, l = this._chain.length; i < l; i++) {
            promise = promise[this._chain[i][0]].apply(promise, this._chain[i].slice(1));
        }

        // Finally, resolve the promise as the user requested.
        return promise[promiseMethod].apply(promise, arguments);
    }).bind(this);
};

/**
 * Returns the wrapped object.
 * @return {Objec}
 */
Wrapper.prototype.getWrapped = function () {
    return this._obj;
};

module.exports = {
    /**
     * Starts a wrapper on an object.
     * @return {Wrapper}
     */
    wrap: function () {
        var wrapper = new Wrapper();
        return wrapper.obj.apply(wrapper, arguments);
    }
};
