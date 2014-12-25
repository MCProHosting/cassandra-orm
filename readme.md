# Cassandra ORM
[![Build Status](https://travis-ci.org/MCProHosting/artisan-cassandra-orm.svg)](https://travis-ci.org/MCProHosting/artisan-cassandra-orm)

Node.js ORM for Cassandra 2.1+. Inspired by SQLAlchemy. WIP.

```js
var Cassandra = require('artisan-cassandra-orm');
var c = new Cassandra({ contactPoints: ['127.0.0.1'], keyspace: 'middleEarth' });

c.select()
 .from('hobbits')
 .where('last_name', '=', 'baggins')
 .limit(2)
 .then(function (results) {
    // ...
 })
```

### Connection

This is based is [datastax/nodejs-driver](https://github.com/datastax/nodejs-driver). You can create a connection by creating a new Connection object. Options are the same as Datastax's driver.

```js
var Cassandra = require('artisan-cassandra-orm');
var c = new Cassandra({ contactPoints: ['127.0.0.1'], keyspace: 'middleEarth' })
```

We promisify and provide some additional methods atop the driver. The following method/properties are available:

 * `.execute(query: String[, params: Array[, options: Object]]) -> Promise` 
 * `.batch(queries: Array[, options: Object]]) -> Promise`
 * `.shutdown() -> Promise`
 * `.connect([options: Object]) -> Promise`
 * `getReplicas`, `stream`, and `eachRow` are passed verbatim to the connection object.
 * `.client` is the underlying Datastax client.

### Query Builder

The query builder is at the core of the ORM. Although it is preferable to interact via models, you can create a query builder directly by calling `.select()`, `.insert()`, `.delete()`, and `.update()` on a connection.

These builders are promise-friendly. By calling a promise method, such as `.then` or `.catch` on the builder, it knows to execute the built query. Builders may expose several components:

#### Common Components

**Note:** For any of these components, you can pass in a raw string or a Column object for any string argument.

##### Raw

Raw strings (created with `c.Stmt.Raw(String)`) will always be inserted into queries without any additions, modifications, or parameterization.

##### Tuples

To create a tuple, use `c.Stmt.Tuple(elements...)`. Tuples can, of course, be nested.

```
.where('profession', '=', c.Stmt.Tuple('burglar', 'adventurer');
// => `WHERE profession = ('burglar', 'adventurer')`
```

We use the tuple here to differentiate it from a List or Set, which are the _only_ data represented as an array.

##### Table

Available on Select and Delete as `.from()`, on Insert as `.into()`, and on update as `.table()`.

It takes either a string, table object, or model object as its first and only parameter, and sets the query to be executed on that table.

```js
.table('hobbits')
```

##### Column

Available on Select, Insert, and Select. Exposes a method "columns" which takes an array of strings or Columns as its first argument, or many strings or columns as a ternary argument.

```
.columns('first_name', 'last_name')
// or...
.columns(['first_name', 'last_name'])
```

##### Where

Available on Select, Insert, Delete, and Update.

 * `.andWhere` alias: `.where`. Adds an "AND" condition to the builder.
 * `.orWhere`. Adds an "OR" condition to the builder.

Both these methods are used in the same way.
 
 * If passed three arguments, it expects them to be `column, operator, value`. The value will be parameterized _unless_ a Raw string is passed.
 * If passed a function as the first an only parameter, it creates a where grouping. For example:

```js
c.select()
 .from('users')
 .where('profession', 'CONTAINS', 'wizard')
 .orWhere('beard_length', '=', c.Stmt.Raw('\'long\''))
 .andWhere(function (w) {
     w.where('location', '=', 'mordor')
      .orWhere('location', '=' 'shire')
 });
```

Outputs:

```sql
SELECT * FROM users
WHERE profession CONTAINS ?
OR beard_length = 'long'
AND (location = ? OR location = ?)

Params: ['wizard', 'mordor', 'shire']
```

#### Options

Options are available on insert, delete, and update queries. The following two method are exposed:

 * `.ttl(seconds: Number)` Sets the time to live of the operation.
 * `.timestamp(microseconds: Number)` Sets the update time (update), creation time (insert), or tombstone record (delete) of the record.

#### Conditionals

Conditionals are available on insert, delete, and update queries.

> In Cassandra 2.0.7 and later, you can conditionally [CRUD] columns using IF or IF EXISTS. Conditionals incur a non-negligible performance cost and should be used sparingly.

They expose a method `.when(key[, value])`. If a value is not passed, it's an IF EXISTS statement. Example:

```js
.when('ring_of_power')
// => IF EXISTS ring_of_power
.when('ring_owner', 'gollum')
// => IF ring_owner = ?
```

#### Builders

##### Select

The select builder provides the components listed above:

 * table as `.from`
 * columns (`.columns`)
 * where (`.where`, `.andWhere`, `.orWhere`)
 * order (`.orderBy`)

Additionally, the following two methods:

 * `.limit(amount: Number)` Limits the query to the following number.
 * `.filter([filtering: Boolean=true])` Turns `ALLOW FILTERING` on or off.

##### Insert

The select builder provides the components listed above:

 * table as `.into`
 * options (`.ttl` and `.timestamp`)

Additionally, the following methods:

 * `.data(map: Object)` Inserts a key: value set of data.
 * `.columns` When inserting columns/values independently (see: columns component).
 * `.values(elements....)` When inserting columns/values independently.

##### Update

The select builder provides the components listed above:

 * table as `.table`
 * where (`.where`, `.andWhere`, `.orWhere`)
 * conditionals (`.when`)
 * options (`.ttl` and `.timestamp`)

Additionally, the following methods:

 * `add(column: String|Column, value)` Appends item(s) to a set, list, or map, or adds to a counter column.
 * `subtract(column: String|Column, value)` Removes item(s) from a set, list, or map, or subtracts to a counter column.
 * `set` can be used in multiple ways:
     * `set(str: String)` Adds a "raw" update. No parameterization or anything. Alias: `setRaw`.
     * `set(column: String|Column, value)` Updates a column to equal a value, `column = value`. Alias: `setSimple`.
     * `set(column: String|Column, index, value)` Updates an index in a set, `column[index] = value`. Alias: `setIndex`.

### Model

> Soon to come...

```js
/**
 * Create a new model. Its name will be converted to
 * snake_case for the table name (it will be `users_info`)
 */ 
var User = c.model('UserInfo');

/**
 * Add columns to the user
 */ 
User.columns([
    t.Text('userid'),
    t.Set('emails', [t.Text()]),
    t.Text('name').partitionKey()
]);
```
