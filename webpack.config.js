const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const _ = require('lodash');
// require('@babel/polyfill'); corejs polyfill

module.exports = (env) => {
	const config = {
		entry: [
			// '@babel/polyfill', corejs polyfill
			path.resolve(__dirname, 'src', 'public', 'js', 'client.js')
		],
		output: {
			path: path.resolve(__dirname, 'src', 'public', 'js'),
			filename: 'index.js'
		},
		module: {
			rules: [
				{
					test: /\.vue$/,
					loader: 'vue-loader'
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'source-map-loader'
						},
						{
							loader: 'babel-loader',
							options: {
								presets: [
									[
										'@babel/preset-env',
										// corejs polyfill
										// {
										// 	"useBuiltIns": "entry",
										// 	'corejs': 3
										// }
									]
								],
							}
						},
					]
				},
				{
					test: /\.css$/,
					use: [
						'vue-style-loader',
						'css-loader',
					]
				},
			],
		},
		resolve: {
			extensions: [".js", ".json", ".vue"],
		},
		plugins: [
			new CompressionPlugin(),
			new VueLoaderPlugin(),
		],
	};

	if(env.production) {
		_.merge(config, {
			mode: 'production',
			stats: 'minimal',
			externals: {
				'vue': 'Vue', // importing 'vue' to resolve to external cdn
			}
		});
	} else if(env.development) {
		_.merge(config, {
			mode: 'development',
			devtool: 'source-map',
			resolve: {
				alias: {
					'vue$': 'vue/dist/vue.js', // importing 'vue' to reference local development version (allows for vue devtools)
				}
			}
		});
	} else {
		throw new Error('Bad webpack env');
	}

	return config;
};