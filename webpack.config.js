const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = {
    mode: 'development',
    entry: {
	app: './src/index.js',
    },

    output: {
	path: path.resolve(__dirname, 'build'),
	filename: 'app.bundle.js'
    },
    
    devServer: {
	contentBase: path.resolve(__dirname, 'build'),
    },

    plugins: [
	new CopyWebpackPlugin(
	    {
		patterns: [
		    path.resolve(__dirname, 'index.html'), 
		    path.resolve(__dirname, 'assets', '**', '*'),
		]
	    }
	),
	new DefinePlugin({
	    'typeof CANVAS_RENDERER': JSON.stringify(true),
	    'typeof WEBGL_RENDERER': JSON.stringify(true)
	}),
    ]
}
