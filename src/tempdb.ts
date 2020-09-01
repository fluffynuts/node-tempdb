import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import path from "path";
import { fs } from "./fs";
import { which } from "./which";
import { ConnectionInfo, DbConfig, KnexConfig } from "./connection-info";

const myPackage = "node-tempdb";
const pbPackage = "PeanutButter.TempDb.Runner";

export enum Databases {
    mysql = "mysql",
    sqlite = "sqlite",
    localdb = "localdb"
}

type Action = ((...args: any[]) => void);

export interface TempDbOptions {
    type?: Databases,
    inactivityTimeoutSeconds?: number;
    absoluteLifespanSeconds?: number;
}

export class TempDb {
    private _lastError: any;

    public static async create(options?: TempDbOptions): Promise<TempDb> {
        const result = new TempDb(options);
        await result.start();
        return result;
    }

    public get type(): Databases {
        return this._type;
    }

    private readonly _type: Databases;
    private readonly _inactivityTimeoutSeconds?: number;
    private readonly _absoluteLifespanSeconds?: number;

    constructor(options?: TempDbOptions) {
        this._type = options?.type ?? Databases.mysql;
        this._inactivityTimeoutSeconds = options?.inactivityTimeoutSeconds;
        this._absoluteLifespanSeconds = options?.absoluteLifespanSeconds;
    }

    public get config(): DbConfig | undefined {
        return this._connectionInfo
            ? this._connectionInfo.clone().config
            : undefined;
    }

    public get knexConfig(): KnexConfig | undefined {
        return this._connectionInfo
            ? this._connectionInfo.clone().knexConfig
            : undefined;
    }

    private get connectionInfo(): ConnectionInfo | undefined {
        return !this._connectionInfo
            ? undefined
            : this._connectionInfo.clone();
    }

    public get isRunning(): boolean {
        return !!this._process;
    }

    private _connectionInfo: ConnectionInfo | undefined;
    private _process: ChildProcessWithoutNullStreams | undefined;

    private _generateTempDbRunnerArgs(): string[] {
        const result = ["-e", this._type];
        if (this._absoluteLifespanSeconds !== undefined) {
            result.push("-a");
            result.push(this._absoluteLifespanSeconds.toString());
        }
        if (this._inactivityTimeoutSeconds !== undefined) {
            result.push("-i");
            result.push(this._inactivityTimeoutSeconds.toString());
        }
        return result;
    }

    /**
     * Starts the instance, returning the connection string once started
     */
    public async start(): Promise<ConnectionInfo> {
        if (this._process) {
            throw new Error(
                "Already started! Stop me first! If you want connection info, observe the connectionInfo property"
            );
        }
        const
            runner = await this.findRunner(),
            args = this._generateTempDbRunnerArgs(),
            process = this._process = spawn(runner, args);
        return new Promise<ConnectionInfo>((resolve, reject) => {
            let resolved = false;
            const stderr: string[] = [];
            process.stdin.setDefaultEncoding("utf8");
            process.stdout.on("data", d => {
                const line = d.toString().replace(/\n$/, "").replace(/\r$/, "");
                if (line.toLowerCase().startsWith("connection string:")) {
                    const connectionstring = line.split(":").slice(1).join(":").trim();
                    this._connectionInfo = new ConnectionInfo(connectionstring, this._type);
                    if (!resolved) {
                        resolve(this._connectionInfo);
                        resolved = true;
                    }
                }
            });
            process.stderr.on("data", d => {
                stderr.push(d.toString());
            });
            process.on("close", code => {
                if (code && !resolved) {
                    reject(`Unable to start up ${ runner }:\n${ stderr.join("\n") }`);
                }
                if (code) {
                    const error = new Error(`TempDbRunner process stops with code: ${ code }`) as any;
                    error.exitCode = code;
                    this._lastError = error;
                    if (this._stopReject) {
                        this._stopReject(error);
                    }
                } else if (this._stopResolve) {
                    this._stopResolve();
                }
                try {
                    this._process?.kill();
                } catch (e) {
                }
                this._process = undefined;
                this._stopResolve = undefined;
                this._stopReject = undefined;
            });
        });
    }

    private _stopResolve: Action | undefined;
    private _stopReject: Action | undefined;

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._process === undefined) {
                return this._lastError
                    ? reject(this._lastError)
                    : reject(new Error(`Not running`));
            }
            if (this._stopResolve) {
                return reject(`Busy trying to stop...`);
            }
            this._stopResolve = resolve;
            this._stopReject = reject;
            this._process.stdin.write("stop\n");
        });
    }

    private findRunner(): Promise<string> {
        // find the package folder
        if (process.platform === "win32") {
            return this.findRunnerForWindows();
        } else {
            return this.findRunnerForNix();
        }
    }

    private async findRunnerForWindows(): Promise<string> {
        // look for lib/net4* on windows
        const
            tempDbBase = await this.findFrameworkPackageFolder(),
            tempDbContents = await fs.readdir(tempDbBase),
            search = `${ pbPackage }.exe`,
            lsearch = search.toLowerCase(),
            launcher = tempDbContents.find(p => p.toLowerCase() === lsearch);
        if (!launcher) {
            throw new Error(`Could not find launcher ${ search } in ${ tempDbBase }`);
        }
        return path.join(tempDbBase, launcher);
    }

    private async findNetCorePackageFolder(): Promise<string> {
        const winner = await this.findPackageLibFolder(
            f => path.basename(f).startsWith("netcore")
        );
        if (!winner) {
            throw new Error(`Can't find netcore libdir under ${ await this.findPackageFolder() }`);
        }
        return winner;
    }

    private async findFrameworkPackageFolder(): Promise<string> {
        const winner = await this.findPackageLibFolder(
            f => path.basename(f).startsWith("net4")
        );
        if (!winner) {
            throw new Error(`Can't find ${ pbPackage } net4x libdir`);
        }
        return winner;
    }

    private async findPackageLibFolder(matching: ((fullpath: string) => boolean)): Promise<string | undefined> {
        const
            packageFolder = await this.findTempDbPackageFolder(),
            libDir = path.join(packageFolder, "lib"),
            contents = await fs.readdir(libDir),
            contentsFullPaths = contents.map(f => path.join(libDir, f))
        return contentsFullPaths.find(matching);
    }

    private async findTempDbPackageFolder(): Promise<string> {
        const
            packageFolder = await this.findPackageFolder(),
            immediateContents = await fs.readdir(packageFolder),
            searchPackageFolder = pbPackage.toLowerCase(),
            tempDbPackageFolder = immediateContents.find(
                p => p.toLowerCase().startsWith(searchPackageFolder)
            );
        if (tempDbPackageFolder) {
            return path.join(packageFolder, tempDbPackageFolder);
        }
        throw new Error(`Could not find ${ pbPackage } package folder under "${ packageFolder }"`);
    }

    private async findRunnerForNix(): Promise<string> {
        const dotnet = await which("dotnet");
        if (dotnet) {
            return this.findDotNetRunnerForNix();
        }
        const mono = await which("mono");
        if (mono) {
            return this.findMonoRunnerForNix();
        }
        throw new Error(`node-tempdb levers off of ${ pbPackage } You either need 'dotnet' or 'mono' to spin it up.`);
    }

    private async findDotNetRunnerForNix(): Promise<string> {
        return this.findShellScriptLauncher(
            await this.findNetCorePackageFolder()
        )
    }

    private async findMonoRunnerForNix(): Promise<string> {
        return this.findShellScriptLauncher(
            await this.findFrameworkPackageFolder()
        );
    }

    private async findShellScriptLauncher(folder: string): Promise<string> {
        const
            contents = await fs.readdir(folder),
            scriptname = "start-tempdb.sh",
            shellscript = contents.find(s => s.toLowerCase() === scriptname);
        if (!shellscript) {
            throw new Error(`Can't find launcher stub ${ scriptname } in ${ folder }`);
        }
        const result = path.join(folder, shellscript);
        // ensure it's a unix file!
        const scriptContents = await fs.readTextFile(result);
        const unixified = scriptContents.split(/[\r|\n]/)
            .filter(l => l.trim() !== "")
            .join("\n");
        await fs.writeFile(result, unixified);
        // ensure it's executable!
        await fs.chmod(result, "755");
        return result;
    }

    private async findPackageFolder(): Promise<string> {
        let
            current = __dirname,
            last = current;
        do {
            last = current;
            const test = path.join(current, "package.json");
            if (await fs.fileExists(test)) {
                try {
                    const
                        contents = await fs.readTextFile(test),
                        pkg = JSON.parse(contents),
                        isMine = pkg.name === myPackage;
                    if (isMine) {
                        return current;
                    }
                } catch (e) {
                    // suppress: if we can't read & parse it, it might as well not exist
                }
            }
            current = path.dirname(current);
        }
        while (last !== current);
        throw new Error(`Can't find package base dir for "${ myPackage }"`);
    }
}
