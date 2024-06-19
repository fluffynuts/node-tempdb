const
  { rm, ls } = require("yafs"),
  writeTextFile = requireModule("write-text-file"),
  { run } = require("./modules/run"),
  { NugetClient } = require("node-nuget-client"),
  { updatePackageFiles, tempDbPackageName } = require("./modules/update-package-files"),
  { config } = require("./modules/config")
  path = require("path"),
  chalk = require("chalk"),
  gulp = requireModule("gulp-with-help");

gulp.task("upgrade-tempdb-runner", async () => {
  const
    output = path.dirname(__dirname),
    nuget = new NugetClient();

  await run(
    `remove any existing ${tempDbPackageName}`,
    async () => {
      const contents = await ls(output, {
        recurse: false
      });
      const toRemove = contents.find(p => path.basename(p).startsWith(tempDbPackageName));
      if (toRemove) {
        await rm(toRemove);
      }
    }
  );

  const dlResult = await run(
    `download latest ${tempDbPackageName}`,
    () => nuget.downloadPackage({
      packageId: tempDbPackageName,
      output
    })
  );

  console.log(chalk.yellow(`  -> ${dlResult.fullName} downloaded`));

  await run(`Update package files entry`, updatePackageFiles);
  // update postinstall script
  await run(`Update config.json`,
    async () => {
      const
        configFile = path.join(__dirname, "modules", "config.json");
      config.tempDb = config.tempDb || {};
      config.tempDb.version = dlResult.version;
      await writeTextFile(configFile, JSON.stringify(config, null, 2));
    });
});


