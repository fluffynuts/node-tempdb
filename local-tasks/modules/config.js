const
  fs = require("fs"),
  path = require("path"),
  text = fs.readFileSync(path.join(__dirname, "config.json"), { encoding: "utf8" }).toString(),
  config = JSON.parse(text);

module.exports = {
  config
};
