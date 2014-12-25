var promiseMethods = ['then', 'spread', 'catch', 'error', 'finally'];
var builders = module.exports = {};

// Bind query types to the exports. Note: when running functions, it's
// expected that the context is the database connection.
require('lodash').forIn({
    select: require('../cql/queries/select'),
    delete: require('../cql/queries/delete'),
    insert: require('../cql/queries/insert'),
    update: require('../cql/queries/update')
}, function (Builder, name) {
    builders[name] = function () {
        return promisifyQuery(new Builder(this));
    };
});


/**
 * Adds promise methods to the query so it is executed when any of them
 * are called.
 * @param  {BaseQuery} query
 * @return {BaseQuery}
 */
function promisifyQuery(query) {
    for (var i = promiseMethods.length - 1; i >= 0; i--) {
        var method = promiseMethods[i];
        query[method] = runMethod.bind(query, method);
    }

    return query;
}

/**
 * Runs a promisify method. Seperate to keep V8 compilation time down.
 * @param  {String} method [description]
 * @return {*}
 */
function runMethod(method) {
    var promise = this.execute();
    return promise[method].apply(promise, [].slice.call(arguments, 1));
}
