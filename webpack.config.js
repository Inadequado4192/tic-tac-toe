const path = require('path');

module.exports = {
    mode: "development",
    entry: path.join(__dirname, "./src/ts/index.ts"),
    output: {
        path: path.join(__dirname, "./src"),
        filename: "index.js",
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader" }
        ]
    }
}