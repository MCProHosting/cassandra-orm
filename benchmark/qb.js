// To use, `npm install benchmark microtime`

var builders = require('../lib/cql/builders');
var t = require('../lib/cql/types');
var Raw = require('../lib/cql/stmt/raw');
var Bluebird = require('bluebird');

new (require('benchmark').Suite)()
    .add('Just for kicks: bluebird', function () {
        Bluebird.resolve(true).then(function () { return "hi"; });
    })
    .add('Select statement builder', function () {
        builders.select()
            .columns('a', 'b')
            .from('tbl')
            .where(t.Text('a'), '<', 3)
            .andWhere('c', '>', 2)
            .parameterize();
    })
    .add('Delete statement builder', function () {
        builders.delete()
            .columns('a', 'b')
            .from('tbl')
            .where(t.Text('a'), '<', 3)
            .andWhere('c', '>', 2)
            .parameterize();
    })
    .add('Insert statement builder', function () {
        builders.insert()
            .data({ 'a': 'b' })
            .into('tbl')
            .ifNotExists()
            .parameterize();
    })
    .add('Update statement builder', function () {
        builders.update()
            .table('tbl')
            .where(t.Text('a'), '<', 3)
            .andWhere('c', '>', 2)
            .set('foo = \'bar\'')
            .set('a', 2)
            .set('a', 2, 3)
            .timestamp(10)
            .ttl(10)
            .parameterize();
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .run();
