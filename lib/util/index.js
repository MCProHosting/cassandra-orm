var _ = require('lodash');

module.exports = _.extend({
        proxyMethod: proxyMethod
    },
    require('./casing'),
    require('./stmt'),
    require('./wrapper')
);

/**
 * Pulls an object property from a path list, e.g. ['a', 'b'] => obj.a.b
 * @param  {Object} obj
 * @param  {[]String} path
 * @return {*}
 */
function lookup (obj, path) {
    if (path.length === 0) {
        return obj;
    }

    return lookup(obj[path.shift()], path);
}

/**
 * Adds a proxy method to the object that calls through to the underlying
 * object, and returns the proxy.
 * @param  {Object} proxy
 * @param  {Object|Function} obj
 * @param  {String} name
 * @param  {String} method
 */
function proxyMethod (proxy, method, name) {
    if (typeof method === 'string') {
        var parts = method.split('.');
        name = parts.slice(-1)[0];
    }

    proxy[name] = function () {
        if (parts) {
            var context = lookup(this, parts.slice(0, -1));
            lookup(context, parts.slice(-1)).apply(context, arguments);
        } else {
            method();
        }
        return this;
    };
}
