const path = require('path');

module.exports = {
    entry: './src/index.js', // Adjust based on app entry point, Removed the relative path
    output: {
        path: path.resolve(__dirname, 'assets/js'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    mode: 'development', // Change to 'production' for production builds
};