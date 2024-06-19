const
  chalk = require("chalk"),
  { rm } = require("yafs"),
  { isFolder } = requireModule("fs"),
  { run } = require("./modules/run"),
  gulp = requireModule("gulp-with-help"),
  { NugetClient } = require("node-nuget-client"),
  { config } = require("./modules/config");

gulp.task("download-tempdb-if-necessary", async () => {
  const
    { packageName, version } = config.tempDb,
    expectedPath = `${packageName}.${version}`;
  if (await isFolder(expectedPath)) {
    console.log(`${packageName} already downloaded to ${expectedPath}`);
    return;
  }
  await rm(expectedPath);
  const result = await run(`Download latest ${packageName}`,
    async () => {
      const client = new NugetClient();
      return await client.downloadPackage({
        packageId: packageName,
        version,
        output: "."
      })
    });
  console.log(chalk.yellow(`  -> ${result.fullName} downloaded!`));
})
