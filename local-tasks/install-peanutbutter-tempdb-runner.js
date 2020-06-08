const
  spawnNuget = requireModule("spawn-nuget"),
  gulp = requireModule("gulp-with-help");

gulp.task("install-peanutbutter-tempdb-runner", async () => {
  return spawnNuget([ "install", "PeanutButter.TempDb.Runner", "-Version", "1.2.362" ]);
})
