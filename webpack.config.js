const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/main.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    alias: {
      vue$: "vue/dist/vue.common.dev",
    },
  },
};
