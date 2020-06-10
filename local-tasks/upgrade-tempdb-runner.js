const
    rimraf = requireModule("rimraf"),
    chalk = require("chalk"),
    readPackageJson = requireModule("read-package-json"),
    writeTextFile = requireModule("write-text-file"),
    { NugetClient } = require("node-nuget-client"),
    { updatePackageFiles, tempDbPackageName } = require("./modules/update-package-files"),
    path = require("path"),
    gulp = requireModule("gulp-with-help");

gulp.task("upgrade-tempdb-runner", async () => {
    const
        output = path.dirname(__dirname),
        nuget = new NugetClient();

    await run(
        `remove any existing ${ tempDbPackageName }`,
        () => rimraf(path.join(output, `${ tempDbPackageName }*`))
    );

    const dlResult = await run(
        `download latest ${ tempDbPackageName }`,
        () => nuget.downloadPackage({
            packageId: tempDbPackageName,
            output
        })
    );

    await run(`Update package files entry`, updatePackageFiles);
    // update postinstall script
    await run(`Update postinstall script`,
        async () => {
            const index = await readPackageJson();
            index.scripts["download-runner"] = `node-nuget download ${ dlResult.fullName }`;
            await writeTextFile(
                "package.json",
                JSON.stringify(index, null, 2)
            );
        });
});

async function run(label, action) {
    try {
        process.stdout.write(`${ chalk.yellow("[ -- ]") } ${ label }`);
        const result = await action();
        console.log((`\r${ chalk.green("[ OK ]") } ${ label }`));
        return result;
    } catch (e) {
        console.log((`\r${ chalk.red("[FAIL]") } ${ label }`));
        throw e;
    }
}

