const webpack = require('webpack');
const path = require('path');

const config = {
    entry: './src/YP.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'YieldProlog.js'
    },
    module: {
        rules: [
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [
            '.tsx',
            '.ts',
            '.js'
        ]
    }
};

module.exports = config;