import "expect-even-more-jest";
import { Databases, ProcessExitError, TempDb, TempDbOptions } from "../src/tempdb";
import Knex from "knex";
import { KnexConfig } from "../src/connection-info";
import { sleep } from "expect-even-more-jest";
const { spyOn } = jest;

describe(`node-tempdb: mysql support`, () => {
    it(`should provide a temp mysql database when available`, async () => {
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
    }, 60000);

    it(`should time out when no activity and configured to time out`, async () => {
        // Arrange
        const instance = create({
            type: Databases.mysql,
            inactivityTimeoutSeconds: 2
        })
        // Act
        const connectionInfo = await instance.start();
        const conn = knexConnect(connectionInfo.knexConfig);
        await expect(conn.select("TABLE_NAME")
            .from("INFORMATION_SCHEMA.TABLES")
        ).resolves.not.toThrow();
        await sleep(3000);
        await expect(conn.select("TABLE_NAME")
            .from("INFORMATION_SCHEMA.TABLES")
        ).rejects.toThrow();
        // Assert
    }, 60000);

    it(`should time out on absolute timeout when configured to time out`, async () => {
        // Arrange
        const instance = create({
            type: Databases.mysql,
            inactivityTimeoutSeconds: 20,
            absoluteLifespanSeconds: 2
        })
        // Act
        const connectionInfo = await instance.start();
        const conn = knexConnect(connectionInfo.knexConfig);
        await expect(conn.select("TABLE_NAME")
            .from("INFORMATION_SCHEMA.TABLES")
        ).resolves.not.toThrow();
        await sleep(3000);
        await expect(conn.select("TABLE_NAME")
            .from("INFORMATION_SCHEMA.TABLES")
        ).rejects.toThrow();
        // Assert
    }, 60000);

    const instances: TempDb[] = [];

    function create(
        options?: TempDbOptions
    ) {
        const result = new TempDb(options);
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
        const log = console.log.bind(console);
        spyOn(console, "log").mockImplementation((...args: any[]) => {
            if (`${args[0]}`.includes("Connection Error")) {
                return;
            }
            log(args);
        })
        for (let instance of toStop) {
            try {
                await instance.stop();
            } catch (e) {
                if (e instanceof ProcessExitError) {
                    if (e.exitCode === 1) {
                        // happens when the connection is interrupted, which is
                        // expected for the end of some of these tests (not under
                        // normal operations though)
                        continue;
                    }
                    console.error(`TempDb Runner process exits with unexpected code: ${ e.exitCode }`, e);
                } else {
                    const message = e instanceof Error
                        ? e.message
                        : `${ e }`;
                    console.error(`TempDb Runner abnormal exit: ${ message }`)
                }
            }
        }
        const conns = connections.splice(0, connections.length);
        for (let conn of conns) {
            await conn.destroy();
        }
    });
});
