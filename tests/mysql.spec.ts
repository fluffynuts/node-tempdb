import "expect-even-more-jest";
import { Databases, TempDb } from "../src";
import Knex from "knex";

describe(`node-tempdb: mysql support`, () => {
    it(`should provide a temp mysql database when available`, async () => {
        jest.setTimeout(30000);
        // Arrange
        const instance = create();
        // Act
        const connectionInfo = await instance.start();
        // Assert
        const conn = Knex(connectionInfo.knexConfig);
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

    afterEach(async () => {
        const toStop = instances.splice(0, instances.length);
        for (let instance of toStop) {
            await instance.stop();
        }
    });
});
