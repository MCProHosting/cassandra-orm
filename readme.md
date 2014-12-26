# Cassandra ORM
[![Build Status](https://travis-ci.org/MCProHosting/artisan-cassandra-orm.svg)](https://travis-ci.org/MCProHosting/artisan-cassandra-orm)

Node.js ORM for Cassandra 2.1+. Inspired by SQLAlchemy. WIP.

Goals/features:

 * A fluent query builder for interacting directly with the database.
 * An ORM tailored to leverage Cassandra's performance boons.
 * An ORM that works how you'd expect and gets out of your way.
 * Emphasis on providing 100% coverage of common (primarily CRUD) database operations, without having to write any raw query.
 * A system which lends itself well to automated migrations. (todo: built-in migrations support?)
 * Promises. Promises everywhere.

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

Additionally, the following two methods:

 * `.limit(amount: Number)` Limits the query to the following number.
 * `.filter([filtering: Boolean=true])` Turns `ALLOW FILTERING` on or off.
 * `.orderBy(column: String, direction: String)`

```js
c.select()
 .columns('first_name')
 .from('hobbits')
 .where('last_name', '=', 'baggins')
 .orderBy('first_name', 'desc')
 .limit(2)
 .filter()
 .then(function (results) {
    // ...
 })
```

##### Insert

The select builder provides the components listed above:

 * table as `.into`
 * options (`.ttl` and `.timestamp`)

Additionally, the following methods:

 * `.data(map: Object)` Inserts a key: value set of data.
 * `.columns` When inserting columns/values independently (see: columns component).
 * `.values(elements....)` When inserting columns/values independently.

```js
c.insert()
 .into('hobbits')
 .data({ first_name: 'Frodo', last_name: 'Baggins' })
 .ttl(60)
 .then(function (results) {
    // ...
 })
```

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

```js
c.update()
 .table('hobbits')
 .when('ring_of_power')
 .where('location', '=', 'erebor')
 .add('victims', 'Smaug')
 .set('location', 'Shire')
 .ttl(60)
 .then(function (results) {
    // ...
 })
```

##### Delete

The delete builder provides the components listed above:

 * table as `.from`
 * where (`.where`, `.andWhere`, `.orWhere`)
 * columns (`.columns`)
 * conditionals (`.when`)
 * options (`.timestamp`)

```js
c.delete()
 .table('dwarves')
 .where('name', '=', 'Thorin Oakenshield')
 .then(function (results) {
    // ...
 })
```

### Modeling - Still a WIP, not implemented (fully)

#### Collections

##### Creation and Settings

Collections are created by calling `.model(name: String)` on the connection object. 

```js
/**
 * Create a new model. Its name will be converted to
 * snake_case for the table name (it will be `users_info`)
 */ 
var User = c.model('UserInfo');

// Or we can explicitly set the table name:
User.table.setName('user_info');
```

##### Adding Columns

The connection also provides all built-in Cassandra types for you: ASCII, BigInt, BLOB, Boolean, Counter, Decimal, Double, Float, IP, Int, Text, Timestamp, TimeUUID, UUID, VarChar, VarIn, Tuple, List, Map, Set.

You can create columns with these like so:

```js
/**
 * Add columns to the user. You can, of course, have
 * many partition keys and secondary keys. They'll
 * be added in the order that the columns are defined
 * in the table.
 */ 
User.columns([
    c.Column.Text('userid').partitionKey(),
    t.Set('emails', [t.Text()]),
    t.Text('name').compoundKey()
]);

/**
 * You may also add table properties.
 */
User.table.addProperty('COMPACT STORAGE');
User.table.addProperty('compression', { sstable_compression: 'LZ4Compressor' });
```

Table schema output:

```sql
CREATE TABLE users_info (
  userid text,
  emails set<text>,
  name text,
  PRIMARY KEY (emails, name)
) WITH COMPACT STORAGE AND
  compression={ 'sstable_compression': 'LZ4Compressor' }
```

##### Table Creation, Migration

TBD

##### Querying

Like with connections, you can start a query relative to the model by calling select/update/insert/delete.

```js
User.select();
User.update();
User.insert();
User.delete();
```

##### Lifecycle

Like Express, lifecycle callbacks are done in the form of middleware. The following callbacks are available:

 * beforeCreate
 * afterCreate
 * beforeDelete
 * afterDelete
 * beforeUpdate
 * afterUpdate

The context, `this` for callbacks will be set to the model object. Methods and attributes on the model (see below) will be available. Example:

```js
User.use('beforeCreate', function (next) {
    var err = validator.try(this.attributes, rules);
    if (err) {
        next(err); // Abort!
    } else {
        next(); // We're all good
    }
});

// You can pass multiple events in as an array.
User.use(['beforeCreate', 'beforeUpdate'], function (next) {
    var self = this;
    if (this.isDirty('password')) {
        bcrypt.hash(this.password, 8, function (err, hashed) {
            if (err) {
                next(err);
            } else {
                self.password = hashed;
                next();
            }
        });
    } else {
        next();
    }
});
```

##### Creating & Looking up Models

Models can either be created or looked up. Creating models can be done via `.new()`:

```js
// Returns a fresh new model!
var user = User.new();
// Create a new model already populated with some data.
var user = User.new({ name: 'Thorin Oakenshield' });
```

There are several methods to look up models:

 * `.findOne()`: Looks up and resolves to a single model.
 * `.find()`: Looks up and resolves to an array of models.

Neither method takes arguments directly. Rather, they return a select query builder. So, for example:

```js
User.find()
    .where('profession', 'CONTAINS', 'wizard')
    .then(function (wizards) {
        // ...
    });
```

##### Custom Methods/Properties

Static methods can be attached to the collection directly, of course:

```js
User.sayHi = function () {
    console.log('Hi');
};
```

You can also define methods or properties that are present on model instances. 

Side note: a conscious decision was made not to provide a means for implementing ES5 getters and setters. Accessors are a controversial design decision at best, and have oft been [called evil](http://www.javaworld.com/article/2073723/core-java/why-getter-and-setter-methods-are-evil.html).

```js
User.define('whoAmI', function () {
    return this.name;
});

User.findOne()
    .where('name', '=', 'Frodo Baggins')
    .then(function (frodo) {
        console.log(frodo.whoAmI());
        // => Frodo Baggins
    });
```

#### Models

Models provide several useful methods and attributes you may use.

##### Attributes

The _only_ enumerable properties on a model are its attributes. This means you can very easily loop through them, serialize the model to JSON, or what have you. You can likewise set to update:

```js
var user = User.new();
user.name = 'Smaug';
user.emails = ['root@erebor.com'];
```

##### Saving/Updating Models

Models can be updated with a simple "save" call. We will create the model in the database if it does not exist, or update an existing model.

Unless "true" is passed as the first parameter, we won't update the model if no properties have been changed.

We do updates very intelligently and efficiently using the excellent [flitbit/diff](https://github.com/flitbit/diff) module.

```js
user.save().then(function (user) {
    // the user model has now been updated!
});
```

##### Utility

 * `.isDirty(column: String|Column) -> Boolean` Returns whether the column has changed since the model was created or synced with the database.
 * `isSynced() -> Boolean` Returns whether any attributes have changed since the object was last updated from the database.
 * `.toObject() -> Object` Returns the current model properties as a plain object.
 * `.toJson() -> String` Converts the current model properties to a string.
 * `.old` is an object which contains the attributes as they exist in the database.
 * `.collection` is a reference to the object's parent collection.
