const
    rimraf = requireModule("rimraf"),
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

    await rimraf(path.join(output, `${tempDbPackageName}*`));

    const dlResult = await nuget.downloadPackage({
        packageId: tempDbPackageName,
        output
    })

    await updatePackageFiles();
    // update postinstall script
    const index = await readPackageJson();
    index.scripts.postinstall = `node-nuget download ${dlResult.fullName}`;
    await writeTextFile(
        "package.json",
        JSON.stringify(index)
    );
});
