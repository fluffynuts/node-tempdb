const
  { readTextFile, writeTextFile } = require("yafs"),
  fs = requireModule("fs"),
  { config } = require("./config"),
  tempDbPackageName = config.tempDb.packageName;

async function updatePackageFiles() {
  const
    folderContents = await fs.readdir("."),
    lpackage = tempDbPackageName.toLowerCase(),
    pbPackageFolders = folderContents.filter(
      f => f.toLowerCase().startsWith(lpackage));
  if (pbPackageFolders.length === 0) {
    throw new Error(`No local installation of ${tempDbPackageName} found`);
  } else if (pbPackageFolders.length > 1) {
    throw new Error(`Multiple installations of ${tempDbPackageName} found; please delete all but one`);
  }
  const
    index = "package.json",
    pkgContents = await readTextFile(index),
    pkg = JSON.parse(pkgContents),
    distMask = recursiveMask("dist"),
    pbMask = recursiveMask(pbPackageFolders[0]);
  pkg.files = (pkg.files || [])
    .filter(f => !f.startsWith("PeanutButter"));
  addIfMissing(pkg.files, distMask);
  addIfMissing(pkg.files, pbMask);

  await writeTextFile(
    index,
    JSON.stringify(
      pkg, null, 2
    )
  );
}

function addIfMissing(array, value) {
  if (array.indexOf(value) > -1) {
    return;
  }
  array.push(value);
}

function recursiveMask(folder) {
  return `${folder}/**/*`
}

module.exports = {
  updatePackageFiles,
  tempDbPackageName
};
