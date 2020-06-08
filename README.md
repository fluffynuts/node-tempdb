# node-tempdb

## What is it?

A node package, piggy-backing off of the .net package PeanutButter.TempDb.Runner,
to provide a mechanism for node tests to run against a temporary database.

## Supported databases
- mysql
- localdb
- sqlite

If you have requests for other engines, please file an issue at 
[the PeanutButter GitHub repository](https://github.com/fluffynuts/PeanutButter). Engine
support will only be considered if there is demand for it (one request _is_ demand :grin:)

## Usage

```typescript
var db = new TempDb(Databases.mysql);
await db.start();

// configuration is available on db
const { host, user, password, database, port } = db.config;

// if you're using knex, there's a convenience wrapper for config:
const knex = Knex(db.knexConfig);

// now you have a clean, empty database!

// later
await db.stop();
```

`TempDb` provides a static method `create` as a shorthand for construction and starting:
```typescript
var db = await TempDb.create(Databases.mysql);
```

`TempDb` should be perfectly usable from JavaScript:

```javascript
let db = await TempDb.create("mysql");

// later
await db.stop();
```

## Recommendations
- `MySql` can take a few seconds to spin up. I suggest creating one TempDb in a `beforeAll()`
  and tearing it down in an `afterAll()`
- you probably already have some kind of db-schema migration strategy in place. Point it at your
  new db and create a clean, useful database!
