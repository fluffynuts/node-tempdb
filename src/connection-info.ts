import { Databases } from "./tempdb";

export type DbConfig = DbConnectionConfig | SqliteConnectionConfig;

export interface Dictionary<T> {
    [key: string]: T;
}

export interface SqliteConnectionConfig {
    filename: string;
}

export interface DbConnectionConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

export interface KnexConfig {
    client: string;
    connection: SqliteConnectionConfig | DbConnectionConfig;
    useNullAsDefault: boolean;
}

export class ConnectionInfo {
    public get options(): Dictionary<string> {
        return { ...this._options };
    }

    private _options: Dictionary<string> = {};

    public get knexConfig(): KnexConfig {
        return {
            client: this.makeKnexClientString(),
            connection: this.config,
            useNullAsDefault: true
        }
    }

    public get config(): DbConnectionConfig | SqliteConnectionConfig {
        return this.makeConnectionInfo();
    }

    constructor(private _connectionString: string, private _type: Databases) {
        const
            config = (_connectionString || "").split(";")
                .reduce((acc, cur) => {
                    const parts = cur.split("=");
                    acc[parts[0]] = parts.slice(1).join("=");
                    return acc;
                }, {} as Dictionary<string>),
            keys = Object.keys(config);
        keys.forEach(k => {
            const
                lower = k.toLowerCase(),
                value = config[k],
                mapped = ConnectionInfo.optionMap[lower] || lower;
            if (!this.mapToInstance(mapped, value)) {
                this._options[k] = value;
            }
        })
    }

    public clone(): ConnectionInfo {
        return new ConnectionInfo(this._connectionString, this._type);
    }

    private _user = "";
    private _pass = "";
    private _host = "";
    private _database = "";
    private _port = 0;

    private makeConnectionInfo(): SqliteConnectionConfig | DbConnectionConfig {
        if (this._type === Databases.sqlite) {
            return {
                filename: this.sanitizePath(this._database)
            }
        } else {
            return {
                database: this._database,
                host: this._host,
                password: this._pass,
                user: this._user,
                port: this._port
            }
        }
    }

    private sanitizePath(str: string): string {
        if (str.startsWith(`"`)) {
            str = str.substr(1);
        }
        if (str.endsWith(`"`)) {
            str = str.substr(0, str.length - 1);
        }
        return str;
    }

    private makeKnexClientString(): string {
        return this._type === Databases.sqlite
            ? "sqlite3"
            : this._type;
    }

    private mapToInstance(key: string, value: string) {
        switch (key) {
            case "user":
                this._user = value;
                return true;
            case "password":
            case "pass":
                this._pass = value;
                return true;
            case "host":
                this._host = value;
                return true;
            case "database":
            case "datasource":
                this._database = value;
                return true;
            case "port":
                const parsed = parseInt(value, 10);
                if (isNaN(parsed)) {
                    throw new Error(`Invalid value for port: ${ value }`);
                }
                this._port = parsed;
                return true;
        }
        return false;
    }

    private static readonly optionMap: Dictionary<string> = {
        "user id": "user",
        "server": "host",
        "initial catalog": "database"
    };
}

