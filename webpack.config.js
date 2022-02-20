const path = require("path");

module.exports = {
  mode: "development",
  //   entry: "./src/main.js",
  //   output: {
  //     filename: "main.js",
  //     path: path.resolve(__dirname, "dist"),
  //   },
  entry: {
    "index.html": "./src/index.html",
    "main.js": "./src/main.js",
  },
  output: {
    path: __dirname,
    filename: "[name]",
  },
};
