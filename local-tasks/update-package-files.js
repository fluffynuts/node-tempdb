const
  readTextFile = requireModule("read-text-file"),
  writeTextFile = requireModule("write-text-file"),
  fs = requireModule("fs"),
  pbPackage = "PeanutButter.TempDb.Runner",
  gulp = requireModule("gulp-with-help");

gulp.task("update-package-files", async () => {
  const
    folderContents = await fs.readdir("."),
    lpackage = pbPackage.toLowerCase(),
    pbPackageFolders = folderContents.filter(
      f => f.toLowerCase().startsWith(lpackage));
  if (pbPackageFolders.length === 0) {
    throw new Error(`No local installation of ${pbPackage} found`);
  } else if (pbPackageFolders.length > 1) {
    throw new Error(`Multiple installations of ${pbPackage} found; please delete all but one`);
  }
  const
    index = "package.json",
    pkgContents = await readTextFile(index),
    pkg = JSON.parse(pkgContents),
    distMask = recursiveMask("dist"),
    pbMask = recursiveMask(pbPackageFolders[0]);
  pkg.files = pkg.files || [];
  addIfMissing(pkg.files, distMask);
  addIfMissing(pkg.files, pbMask);

  await writeTextFile(
    index,
    JSON.stringify(
      pkg, null, 2
    )
  );
});

function addIfMissing(array, value) {
  if (array.indexOf(value) > -1) {
    return;
  }
  array.push(value);
}

function recursiveMask(folder) {
  return `${folder}/**/*`
}
