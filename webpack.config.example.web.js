const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
		mode: "production",
		devServer: {
				contentBase: './example/dist/web',
		},
		entry: './example/src/web/index.ts',
		plugins: [
				new CleanWebpackPlugin({
						cleanAfterEveryBuildPatterns: ['./example/dist/web']
				}),
				new HtmlWebpackPlugin({
						template: './example/src/web/index.html'
				}),
		],
		output: {
				path: __dirname + '/example/dist/web',
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
										configFile: "tsconfig.example.web.json"
								}
						}
				]
		}
}
