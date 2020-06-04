import { promises as _fs, StatsBase } from "fs";
import path from "path";

const textFileOptions = { encoding: "utf8" };

async function testPath(at: string, fn: (st: StatsBase<any>) => boolean): Promise<boolean> {
    try {
        const st = await _fs.stat(at);
        return fn(st);
    } catch (e) {
        return false;
    }
}

function fileExists(at: string): Promise<boolean> {
    return testPath(at, st => st.isFile());
}

function folderExists(at: string): Promise<boolean> {
    return testPath(at, st => st.isDirectory());
}

async function readTextFile(at: string): Promise<string> {
    return (await _fs.readFile(at, textFileOptions)) as string;
}

async function writeTextFile(at: string, contents: string): Promise<void> {
    const folder = path.dirname(at);
    if (!(await folderExists(folder))) {
        await _fs.mkdir(folder)
    }
    await _fs.writeFile(at, contents, textFileOptions);
}

export const fs = {
    ..._fs,
    fileExists,
    folderExists,
    readTextFile,
    writeTextFile
};
