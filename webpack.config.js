const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	entry: {
		game: './src/game.ts',
		leveleditor: './src/leveleditor.ts'
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true
	},
	plugins: [
		new HTMLWebpackPlugin({
			title: "Wolfenstein3D",
			filename: "game/index.html",
			chunks: ['game']
		}),
		new HTMLWebpackPlugin({
			title: "Map editor",
			filename: "leveleditor/index.html",
			chunks: ['leveleditor']
		})
	],
	module: {
		rules: [
				{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
				}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	watch: true
}