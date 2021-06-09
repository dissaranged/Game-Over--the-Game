const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports = {
    mode: 'none',
    entry: {
	app: './src/main.js',
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
		    path.resolve(__dirname, 'main.html'), 
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
