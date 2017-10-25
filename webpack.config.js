const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackVersionHashPlugin = require('webpack-version-hash-plugin');
module.exports = {
  entry: {
	  bundle: './src/ui/index.tsx',
	  serviceWorker: './src/ui/serviceWorker.ts'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/build-web'
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: "source-map-loader"
      },
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        use: "source-map-loader"
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
      },

      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000&name=./fonts/[hash].[ext]'
      },
      /*
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/font-woff"
      }, {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/font-woff"
      }, {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=application/octet-stream"
      }, {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file"
      }, {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: "url?limit=10000&mimetype=image/svg+xml"
      }
      */
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  plugins: [
    new ExtractTextPlugin("bundle.css"),
    new CopyWebpackPlugin([
      { from: 'src/webstatic' },
    ]),
    new WebpackVersionHashPlugin({
      filename: 'version.json',
      include_date: true
    })
  ],  
  devtool: '#cheap-module-source-map',
  devServer: {
    contentBase: "build-web",
    port: 4000,
    // host: '0.0.0.0',
    // disableHostCheck: true
    /* overlay: {
      warnings: true,
      errors: true
    }
    */
  }
};
