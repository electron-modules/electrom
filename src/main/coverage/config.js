'use strict';

const path = require('path');

module.exports = () => {
  const cwd = process.cwd();
  const dotelectrom = path.resolve(cwd, '.electrom');
  const coverageDir = path.resolve(dotelectrom, 'coverage');
  const metaFile = path.resolve(dotelectrom, 'meta.json');
  return {
    cacheDir: dotelectrom,
    coverageDir,
    metaFile,
  };
};
