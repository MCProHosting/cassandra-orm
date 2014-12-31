var util = require('../util');
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
        return new Builder(this);
    };
});
