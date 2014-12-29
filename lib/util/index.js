var _ = require('lodash');

module.exports = _.extend({
        proxyMethod: proxyMethod
    },
    require('./casing'),
    require('./stmt'),
    require('./wrapper')
);

/**
 * Adds a proxy method to the object that calls through to the underlying
 * object, and returns the proxy.
 * @param  {Object} proxy
 * @param  {Object} obj
 * @param  {String} method
 */
function proxyMethod (proxy, obj, method) {
    proxy[method] = function () {
        obj[method].apply(obj, arguments);
        return proxy;
    };
}
