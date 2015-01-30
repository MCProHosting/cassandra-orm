var Connection = require('../lib/connection');
var _ = require('lodash');

describe('connection', function () {
    if (process.env.TEST_INTEGRATION) {
        var helper = require('./helper');

        describe('interaction', function () {
            var connection;

            beforeEach(function (ready) {
                connection = helper().then(ready);
            });

            afterEach(function (closed) {
                connection.then(function () {
                    return this.shutdown();
                }).then(closed);
            });

            it('basic methods works', function (done) {
                connection.then(function () {
                    // At this point the raw .executes will have been called. Try
                    // the select binding.
                    return this.select().from('users');
                }).then(function (results) {
                    // Make sure it works there.
                    expect(_.pick(results.rows[0], ['first_name', 'last_name']))
                        .toEqual({ first_name: 'Connor', last_name: 'Peet' });

                    // Now make sure shutdown works. Done won't be called and we'll
                    // get a timeout error if this fails.
                    return done();
                });
            });
            it('batch works', function (done) {
                connection.then(function () {
                    // At this point the raw .executes will have been called. Try
                    // the select binding.
                    return this.batch([
                        this.update().table('users').set('last_name', 'bar').where('first_name', '=', 'Connor'),
                        this.insert().into('users').data({ first_name: 'John', last_name: 'Doe' })
                    ]);
                }).then(done);
            });

            it('is an eventemitter', function (done) {
                var emitted = jasmine.createSpy();
                connection.then(function () {
                    this.on('query', emitted);
                    return this.execute('select * from users;', [], {})
                }).then(function () {
                    expect(emitted).toHaveBeenCalledWith('select * from users;', [], { prepare: true });
                    done();
                });
            });
        });
    }

    it('exposes type', function () {
        var connection = new Connection();
        expect(connection.Text('foo') instanceof require('../lib/cql/column/basic')).toBe(true);
    });
});
