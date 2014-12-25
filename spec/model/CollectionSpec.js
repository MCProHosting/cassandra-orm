var t = require('../../lib/cql/types');
var Collection = require('../../lib/model/collection');

describe('collection', function () {
    var collection;

    beforeEach(function () {
        collection = new Collection(null, 'UsersStuff');
    });

    it('generates the table', function () {

        expect(collection
            .columns([
                t.Text('userid'),
                t.Set('emails', [t.Text()]),
                t.Text('name').partitionKey()
            ])
            .partitionKey('userid')
            .compoundKey('emails')
            .table()
            .toString()
        ).toBe('CREATE TABLE users_stuff (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY ((name, userid), emails)\r\n'+
            ')');
    });
});
