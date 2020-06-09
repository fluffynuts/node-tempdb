const
    gulp = requireModule("gulp-with-help"),
    { updatePackageFiles } = require("./modules/update-package-files");

gulp.task("update-package-files", async () => {
    await updatePackageFiles();
});

