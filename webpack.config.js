const webpack = require("webpack");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const ServiceWorkerWebpackPlugin = require("serviceworker-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const devServer /*: webpackDevServer.Configuration */ = {
  contentBase: "./built-web",
  port: 4099,
  hot: true,
  disableHostCheck: true,
  // inline: false, // for serviceWorker development tests
};

const config = (env, argv) => {
  const MODE_DEVELOPMENT = argv.mode === "development";

  const developmentModePlugins = MODE_DEVELOPMENT
    ? [
        // TODO: Disable this for webworker development
        // new webpack.HotModuleReplacementPlugin(),

        new ForkTsCheckerWebpackPlugin({
          tslint: true,
          memoryLimit: 4096, // 2048 is default and this is not enough?
        }),
      ]
    : [];

  return {
    entry: {
      index: "./src/ui/index.tsx",
      worker: "./src/ui/worker/worker.ts",
      serviceWorker: "./src/ui/serviceWorker.ts",
    },

    output: {
      filename: "[name].js",
      chunkFilename: "[id].js",
      path: __dirname + "/built-web",
      globalObject:
        /* This is small workaround for workers scope and HotModuleReplacementPlugin */ MODE_DEVELOPMENT
          ? "this"
          : undefined,
    },

    plugins: [
      ...developmentModePlugins,
      new CopyWebpackPlugin([
        {
          from: "src/webstatic",
        },
      ]),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].css",
        chunkFilename: "[id].css",
      }),
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(new Date().toISOString()),
      }),
      new ServiceWorkerWebpackPlugin({
        entry: "./src/ui/serviceWorker.ts",
        filename: "sw.js",
      }),
    ],

    module: {
      rules: [
        {
          enforce: "pre",
          test: /\.(js|ts|tsx)$/,
          loader: "source-map-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          options: {
            transpileOnly: true, // IMPORTANT! use transpileOnly mode to speed-up compilation
            compilerOptions: {
              target: MODE_DEVELOPMENT ? "ES2018" : "es5",
              downlevelIteration: MODE_DEVELOPMENT ? false : true,
              module: "ESNext",
              moduleResolution: "node",
            },
          },
          exclude: /node_modules/,
        },

        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },

        {
          test: /\.(png|svg|jpg|gif)$/,
          use: ["file-loader?name=img/[hash].[ext]"],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: ["file-loader?name=fonts/[hash].[ext]"],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
    },

    devServer,
  };
};

module.exports = config;
