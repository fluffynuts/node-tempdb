import _which  from "which"

export function which(cmd: string): Promise<string | undefined> {
    return new Promise(resolve => {
        _which(cmd, (err, data) => {
            return resolve(err ? undefined : data);
        });
    });
}
