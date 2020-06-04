import "expect-even-more-jest";
import { Databases, TempDb } from "../src";
import Knex from "knex";

describe(`node-tempdb: sqlite support`, () => {
    it(`should provide a temp sqlite database on request`, async () => {
        // Arrange
        const instance = create(Databases.sqlite);
        // Act
        const connectionInfo = await instance.start();
        // Assert
        const conn = Knex(connectionInfo.knexConfig);
        const result = await conn.select("name")
            .from("sqlite_master")
            .where("type", "=", "table");
        expect(result)
            .toBeEmptyArray();
    });

    const instances: TempDb[] = [];

    function create(type?: Databases) {
        const result = new TempDb(type);
        instances.push(result);
        return result;
    }

    afterEach(async () => {
        const toStop = instances.splice(0, instances.length);
        for (let instance of toStop) {
            await instance.stop();
        }
    });
});