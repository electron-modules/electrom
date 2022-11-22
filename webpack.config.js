'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const bindMiddleware = require('./src/main/coverage/middleware');

const pkg = require('./package');

const { NODE_ENV } = process.env;
const rootPath = process.cwd();
const rendererPath = path.resolve(rootPath, 'src', 'renderer');

const isProd = NODE_ENV === 'production';

module.exports = {
  stats: 'errors-only',
  mode: NODE_ENV,
  devtool: 'source-map',
  entry: {
    app: path.resolve(rendererPath, 'App'),
  },
  output: {
    path: path.resolve(rootPath, 'dist'),
    publicPath: isProd ? '.' : '/',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json', '.less'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.less$/,
        include: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
            options: {
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[name]_[local]_[hash:base64:5]',
            },
          },
          {
            loader: 'less-loader',
          },
        ],
      },
      {
        test: /.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
    ],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    moment: 'moment',
  },
  plugins: [
    new webpack.ProgressPlugin((percentage, message, ...args) => {
      console.info(`${parseInt(percentage * 100, 10)}%`, message, ...args);
    }),
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(pkg.version),
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(rendererPath, 'index.html'),
      inject: false,
      title: pkg.name,
      minify: false,
      templateParameters: {
        depsAssetsList: [
          ...[
            'https://cdn.bootcdn.net/ajax/libs/moment.js/2.24.0/moment.min.js',
          ],
          ...isProd ? [
            'https://cdn.bootcdn.net/ajax/libs/react/17.0.2/umd/react.production.min.js',
            'https://cdn.bootcdn.net/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js',
          ] : [
            './node_modules/react/umd/react.development.js',
            './node_modules/react-dom/umd/react-dom.development.js',
          ],
        ].map(src => `<script src="${src}"></script>`).join('\n'),
      },
    }),
  ],
  devServer: {
    client: {
      overlay: { errors: true, warnings: false },
      progress: true,
      webSocketURL: {
        hostname: 'localhost',
      },
    },
    static: [
      {
        directory: rootPath,
      },
    ],
    onBeforeSetupMiddleware: (server) => {
      bindMiddleware(server.app, server);
    },
  },
  optimization: {
    concatenateModules: true,
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
  },
};
