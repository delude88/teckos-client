const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
		entry: './example/index.ts',
		plugins: [
				new CleanWebpackPlugin({
						cleanAfterEveryBuildPatterns: ['dist']
				}),
				new HtmlWebpackPlugin({
						template: 'example/index.html'
				}),
		],
		output: {
				path: __dirname + '/public',
				filename: 'build/[name].[contenthash].js'
		},
		resolve: {
				extensions: ['.ts', '.tsx', '.js'],
		},
		module: {
				rules: [
						{
								test: /\.tsx?$/,
								exclude: [/node_modules/],
								loader: "ts-loader",
								options: {
										configFile: "tsconfig.example.json"
								}
						}
				]
		}
}
