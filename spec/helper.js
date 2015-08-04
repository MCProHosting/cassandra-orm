var Connection = require('../lib/connection');
var connection = new Connection({ contactPoints: ['127.0.0.1'], keyspace: 'test' });

module.exports = function () {
    return connection.execute('DROP TABLE IF EXISTS users')
        .then(function () {
            return connection.execute(
                'CREATE TABLE users (' +
                '    first_name text PRIMARY KEY,' +
                '    last_name text, a int' +
                ');');
        })
        .then(function () {
            return connection.execute(
                'INSERT INTO users (first_name, last_name, a) VALUES (?, ?, ?);',
                ["Connor", "Peet", "42"]
            );
        })
        .bind(connection);
};
