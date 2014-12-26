var t = require('../../lib/cql/types');
var Collection = require('../../lib/model/collection');

describe('collection', function () {
    var collection, connection;

    beforeEach(function () {
        connection = {};
        collection = new Collection(connection, 'UsersStuff');
    });

    it('generates the table', function () {
        expect(collection
            .columns([
                t.Text('userid'),
                t.Set('emails', [t.Text()]),
                t.Text('name').partitionKey()
            ])
            .table
            .toString()
        ).toBe('CREATE TABLE users_stuff (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY (name)\r\n'+
            ')');
    });

    it('starts select', function () {
        connection.select = jasmine.createSpy('select').and.returnValue(connection);
        connection.from = jasmine.createSpy('from');
        collection.select();
        expect(connection.select).toHaveBeenCalled();
        expect(connection.from).toHaveBeenCalledWith('users_stuff');
    });

    it('starts insert', function () {
        connection.insert = jasmine.createSpy('insert').and.returnValue(connection);
        connection.into = jasmine.createSpy('into');
        collection.insert();
        expect(connection.insert).toHaveBeenCalled();
        expect(connection.into).toHaveBeenCalledWith('users_stuff');
    });

    it('starts update', function () {
        connection.update = jasmine.createSpy('update').and.returnValue(connection);
        connection.table = jasmine.createSpy('table');
        collection.update();
        expect(connection.update).toHaveBeenCalled();
        expect(connection.table).toHaveBeenCalledWith('users_stuff');
    });

    it('starts delete', function () {
        connection.delete = jasmine.createSpy('delete').and.returnValue(connection);
        connection.from = jasmine.createSpy('from');
        collection.delete();
        expect(connection.delete).toHaveBeenCalled();
        expect(connection.from).toHaveBeenCalledWith('users_stuff');
    });
});
