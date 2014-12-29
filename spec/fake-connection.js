var Connection = require('../lib/connection');
var Bluebird = require('bluebird');

module.exports = function () {
    var connection = new Connection();

    connection.resolvedQuery = true;
    connection.queryLog = [];
    connection.execute = function () {
        connection.queryLog.push([].slice.call(arguments));
        return Bluebird.resolve(connection.resolvedQuery);
    };

    return connection;
};
