# node-tempdb

![Test results on Linux](https://github.com/fluffynuts/node-tempdb/workflows/Tests%20(linux)/badge.svg)
![Test results on Windows](https://github.com/fluffynuts/node-tempdb/workflows/Tests%20(windows)/badge.svg)
![npm downloads per week](https://img.shields.io/npm/dw/node-tempdb)

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

## Troubleshooting MySql

### Supported versions
PeanutButter.TempDb.Runner has been tested with the following versions of MySql:
- 5.6 (Windows, OSX)
- 5.7 (Windows)
- 8.0.20 (Gentoo Linux)

Each of those versions has subtle differences which affect bootstrapping of the temporary instance.
If you find that `node-tempdb` is unable to bootstrap mysql for any reason, please open an issue
at GitHub. You should be prepared to help me debug it!

PeanutButter.TempDb.Runner will automagically find mysqld if:
- it's in your path
- you're on Windows and it's an installed service

Generally, this means:
- an installed mysql server on Windows will _just work_
- and installed mysql server on most Linux distros will _just work_
- mysql installed via homebrew on OSX will work -- if you add the bin dir from the install
  folder to your PATH (as soon as I have an OSX machine to test on I'm sure I can automate
  this). `brew info mysql` should tell you where it's installed to. In the wild, I've seen
  the path `/usr/local/mysql/bin` as the home where `mysqld` might live on OSX.
