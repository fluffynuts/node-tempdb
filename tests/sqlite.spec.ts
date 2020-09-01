import "expect-even-more-jest";
import { Databases, TempDb } from "../src/tempdb";
import Knex from "knex";
import { KnexConfig, SqliteConnectionConfig } from "../src/connection-info";

describe(`node-tempdb: sqlite support`, () => {
    it(`should provide a temp sqlite database on request`, async () => {
        // Arrange
        const instance = create(Databases.sqlite);
        // Act
        const connectionInfo = await instance.start();
        // Assert
        const conn = knexConnect(connectionInfo.knexConfig);
        const result = await conn.select("name")
            .from("sqlite_master")
            .where("type", "=", "table");
        expect(result)
            .toBeEmptyArray();
    });

    it(`should stop`, async () => {
        // Arrange
        const instance = create(Databases.sqlite);
        // Act
        const connectionInfo = await instance.start();
        await instance.stop();
        // Assert
        const connection = connectionInfo.config as SqliteConnectionConfig;
        expect(connection.filename)
            .not.toBeFile();
    });

    it(`should have a static create method which starts up the database`, async () => {
        // Arrange
        const instance = await staticCreate(Databases.sqlite);
        const config = instance.knexConfig;
        if (!config) {
            throw new Error("Started TempDb instance should have config");
        }
        // Act
        // Assert
        const conn = knexConnect(config);
        const result = await conn.select("name")
            .from("sqlite_master")
            .where("type", "=", "table");
        expect(result)
            .toBeEmptyArray();
    });

    const instances: TempDb[] = [];

    function create(type?: Databases) {
        const result = new TempDb({ type });
        instances.push(result);
        return result;
    }

    async function staticCreate(type?: Databases) {
        const result = await TempDb.create({ type });
        instances.push(result);
        return result;
    }

    let connections: any[] = [];
    function knexConnect(config: KnexConfig) {
        const result = Knex(config);
        connections.push(result);
        return result;
    }


    afterEach(async () => {
        const toStop = instances.splice(0, instances.length);
        for (let instance of toStop) {
            if (instance.isRunning) {
                await instance.stop();
            }
        }
        const conns = connections.splice(0, connections.length);
        for (let conn of conns) {
            await conn.destroy();
        }
    });
});
