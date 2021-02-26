'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');

const noCacheRequire = (resolvedPath) => {
  delete require.cache[resolvedPath];
  return require(resolvedPath);
};

module.exports = {
  entry: './example/renderer/main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/dist',
    filename: 'example.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      }, {
        test: /\.json$/,
        loader: 'json-loader',
        type: 'javascript/auto',
        exclude: /node_modules/,
      }, {
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
      }, {
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
      }, {
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
  devtool: '#eval-source-map',
  devServer: {
    before: app => {
      app.get('/coverage', (req, res, next) => {
        const template = fs.readFileSync('./reporter.html', 'utf-8');
        res.send(template);
      });
      app.get('/coverage.json', (req, res, next) => {
        const dataDir = path.resolve('./data');
        const meta = noCacheRequire('./meta');
        const list = globby.sync([
          `${dataDir}/**/*.json`,
        ]);
        const result = {};
        list.map(file => {
          const data = require(file);
          data
            .filter(item => item.used)
            .map(item => {
              const { startOffset, endOffset, styleSheetId } = item;
              const metaData = meta[styleSheetId];
              if (metaData) {
                const sourceURL = metaData.sourceURL;
                result[sourceURL] = result[sourceURL] || [];
                result[sourceURL].push({
                  startOffset,
                  endOffset,
                })
              }
            });
        });
        res.json({
          meta,
          list,
          result,
        });
      });
    },
  }
};
