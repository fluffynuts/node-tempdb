import "expect-even-more-jest";
import { Databases, TempDb } from "../src/tempdb";
import Knex from "knex";
import { KnexConfig } from "../src/connection-info";

describe(`node-tempdb: mysql support`, () => {
    it(`should provide a temp mysql database when available`, async () => {
        jest.setTimeout(60000);
        // Arrange
        const instance = create();
        // Act
        const connectionInfo = await instance.start();
        // Assert
        const conn = knexConnect(connectionInfo.knexConfig);
        const result = await conn.select("TABLE_NAME")
            .from("INFORMATION_SCHEMA.TABLES");
        expect(result)
            .not.toBeEmptyArray();
    });

    const instances: TempDb[] = [];

    function create(type?: Databases) {
        const result = new TempDb(type);
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
            await instance.stop();
        }
        const conns = connections.splice(0, connections.length);
        for (let conn of conns) {
            await conn.destroy();
        }
    });
});
