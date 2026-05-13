const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const _ = require('lodash');

module.exports = (env) => {
	const config = {
		entry: [
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
			],
		},
		resolve: {
			extensions: [".js", ".json", ".vue"],
		},
		plugins: [
			new VueLoaderPlugin(),
		],
	};

	if(env.production) {
		_.merge(config, {
			mode: 'production',
			stats: 'minimal',
		});
	} else if(env.development) {
		_.merge(config, {
			mode: 'development',
			devtool: 'source-map',
		});
	} else {
		throw new Error('Bad webpack env');
	}

	return config;
};
