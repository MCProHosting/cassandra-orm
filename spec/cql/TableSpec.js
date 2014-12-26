var Table = require('../../lib/cql/table');
var t = require('../../lib/cql/types');

describe('table generation', function () {
    it('generates a basic table', function () {
        expect(new Table('users')
            .addColumn(t.Text('userid'))
            .addColumn(t.Set('emails', [t.Text()]))
            .addColumn(t.Text('name'))
            .toString()
        ).toBe('CREATE TABLE users (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text\r\n' +
            ')');
    });

    it('sets the name', function () {
        expect(new Table('users')
            .setName('foo')
            .addColumn(t.Text('userid'))
            .toString()
        ).toBe('CREATE TABLE foo (\r\n' +
            '  userid text\r\n' +
            ')');
    });

    it('adds single partition index', function () {
        expect(new Table('users')
            .addColumn(t.Text('userid'))
            .addColumn(t.Set('emails', [t.Text()]))
            .addColumn(t.Text('name'))
            .addPartitionKey('name')
            .toString()
        ).toBe('CREATE TABLE users (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY (name)\r\n'+
            ')');
    });

    it('adds multiple partition indexes', function () {
        expect(new Table('users')
            .addColumn(t.Text('userid'))
            .addColumn(t.Set('emails', [t.Text()]))
            .addColumn(t.Text('name'))
            .addPartitionKey('name')
            .addPartitionKey('userid')
            .toString()
        ).toBe('CREATE TABLE users (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY ((name, userid))\r\n'+
            ')');
    });

    it('adds compound index', function () {
        expect(new Table('users')
            .addColumn(t.Text('userid'))
            .addColumn(t.Set('emails', [t.Text()]))
            .addColumn(t.Text('name'))
            .addPartitionKey('name')
            .addCompoundKey('userid')
            .toString()
        ).toBe('CREATE TABLE users (\r\n' +
            '  userid text,\r\n' +
            '  emails set<text>,\r\n' +
            '  name text,\r\n' +
            '  PRIMARY KEY (name, userid)\r\n'+
            ')');
    });

    it('adds table properties', function () {
        expect(new Table('users')
            .addColumn(t.Text('userid'))
            .addProperty('COMPACT STORAGE')
            .addProperty('compression', { sstable_compression: 'LZ4Compressor' })
            .addProperty('caching', { keys: 'ALL', rows_per_partition: 'NONE' })
            .addProperty('comment', 'Hello World')
            .addProperty('gc_grace_seconds', 864000)
            .toString()
        ).toBe('CREATE TABLE users (\r\n'+
            '  userid text\r\n'+
            ') WITH COMPACT STORAGE AND\r\n'+
            '  compression={ \'sstable_compression\': \'LZ4Compressor\' } AND\r\n'+
            '  caching=\'{"keys":"ALL","rows_per_partition":"NONE"}\' AND\r\n'+
            '  comment=\'Hello World\' AND\r\n'+
            '  gc_grace_seconds=864000');
    });
});

// describe('table parser', function () {
//     var parsed;
//     beforeEach(function () {
//         parsed = tableParser(
//             "CREATE TABLE users (" +
//             "  userid text," +
//             "  emails set<text>," +
//             "  first_name text," +
//             "  last_name text," +
//             "  todo map<timestamp, text>," +
//             "  top_scores list<int>," +
//             "  PRIMARY KEY (userid)" +
//             ") WITH" +
//             "  bloom_filter_fp_chance=0.010000 AND" +
//             "  caching='{\"keys\":\"ALL\", \"rows_per_partition\":\"NONE\"}' AND" +
//             "  comment='' AND" +
//             "  dclocal_read_repair_chance=0.100000 AND" +
//             "  gc_grace_seconds=864000 AND" +
//             "  read_repair_chance=0.000000 AND" +
//             "  default_time_to_live=0 AND" +
//             "  speculative_retry='99.0PERCENTILE' AND" +
//             "  memtable_flush_period_in_ms=0 AND" +
//             "  compaction={'class': 'SizeTieredCompactionStrategy'} AND" +
//             "  compression={'sstable_compression': 'LZ4Compressor'};"
//         );
//     });

//     it('parses columns correctly', function () {

//     });
// });
