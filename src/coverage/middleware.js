'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const globby = require('globby');

const getConfig = require('./config');

const noCacheRequire = (resolvedPath) => {
  delete require.cache[resolvedPath];
  return require(resolvedPath);
};

module.exports = (app, server, options = {}) => {
  const { port, host, protocol = 'http' } = server.options;
  const prettyPrintUrl = (newHostname, pathname) =>
    url.format({
      protocol,
      hostname: newHostname,
      port,
      pathname,
    });
  const config = Object.assign(getConfig(), options);
  const { coverageDir, metaFile } = config;

  const electromPathname = '/electrom/coverage';
  const electromPathnameJson = `${electromPathname}.json`;

  console.log('\nCoverage reporter is running at %s\n', prettyPrintUrl(host, electromPathname));

  app.get(electromPathname, (_, res) => {
    const templateFile = path.resolve(__dirname, 'reporter.html');
    const body = fs.readFileSync(templateFile, 'utf-8');
    res.send(body);
  });

  app.get(electromPathnameJson, (_, res) => {
    const meta = noCacheRequire(metaFile);
    const list = globby.sync([`${coverageDir}/**/*.json`]);
    const result = {};
    list.map((file) => {
      const data = require(file);
      data
        .filter((item) => item.used)
        .map((item) => {
          const { startOffset, endOffset, styleSheetId } = item;
          const metaData = meta[styleSheetId];
          if (metaData) {
            const sourceURL = metaData.sourceURL;
            result[sourceURL] = result[sourceURL] || [];
            result[sourceURL].push({
              startOffset,
              endOffset,
            });
          }
        });
    });
    res.json({
      meta,
      list,
      result,
    });
  });
};
