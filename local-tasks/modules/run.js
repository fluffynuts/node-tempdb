const
  chalk = require("chalk");

async function run(label, action) {
  try {
    process.stdout.write(`${chalk.yellow("[ -- ]")} ${label}`);
    const result = await action();
    console.log((`\r${chalk.green("[ OK ]")} ${label}`));
    return result;
  } catch (e) {
    console.log((`\r${chalk.red("[FAIL]")} ${label}`));
    throw e;
  }
}

module.exports = {
  run
};
