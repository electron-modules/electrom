'use strict';

const fs = require('fs');
const path = require('path');

class TextReporter {}

const pickDataFromDir = (dir) => {
  const res = [];
  fs.readdirSync(dir)
    .filter(file => path.extname(file) === '.json')
    .forEach(file => {
      const filePath = path.join(dir, file);
      res.push({
        key: path.basename(file, path.extname(file)),
        data: require(filePath),
      });
      delete require.cache[filePath];
    });
  return res;
};

const genSummary = (data) => {
  const pickCount = data.length;
  return {
    pickCount,
  };
};

const genReporter = (originData) => {
  const data = genSummary(originData);
  const { pickCount } = data;
  return [
    `采点: ${pickCount}`,
  ].join('\n');
};

TextReporter.genReporter = genReporter;

TextReporter.pickDataFromDir = pickDataFromDir;

module.exports = TextReporter;
