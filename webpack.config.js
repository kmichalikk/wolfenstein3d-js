const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	entry: {
		game: './src/game/main.ts',
		leveleditor: './src/leveleditor/main.ts'
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
				},
				{
					test: /\.(png|jpe?g|gif|wav|mp3)$/i,
					use: 'file-loader'
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader']
				}
		]
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ]
	},
	devServer: {
		static: {
			directory: path.resolve(__dirname, "/dist")
		}
	}
}