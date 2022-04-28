'use strict';

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const getConfig = require('./config');

// https://chromedevtools.github.io/devtools-protocol/tot/CSS/

module.exports = async (win, options = {}) => {
  const config = Object.assign(getConfig(), options);
  const { cacheDir, metaFile, coverageDir } = config;

  rimraf.sync(cacheDir);
  const {
    onMetaChange = (data) => {
      mkdirp.sync(cacheDir);
      fs.writeFileSync(metaFile, JSON.stringify(data, null, 2));
    },
    onCoverageChange = (data) => {
      const { coverage, timestamp } = data;
      mkdirp.sync(coverageDir);
      const file = path.join(coverageDir, `${timestamp}.json`);
      fs.writeFileSync(file, JSON.stringify(coverage, null, 2), 'utf-8');
    },
  } = config;
  try {
    win.webContents.debugger.attach('1.3');
  } catch (err) {
    console.log('Debugger attach failed : ', err);
  }

  win.webContents.debugger.on('detach', (_, reason) => {
    console.log('Debugger detached due to : ', reason);
  });

  const stylesheetMap = {};

  const takeCoverageDelta = async () => {
    const { coverage, timestamp } = await win.webContents.debugger.sendCommand('CSS.takeCoverageDelta');
    if (coverage.length) {
      onCoverageChange({
        coverage,
        timestamp,
      });
    }
  };

  win.webContents.debugger.on('message', (_, method, params) => {
    if (method === 'CSS.styleSheetAdded') {
      const { header } = params;
      // inline style
      if (header.isInline || header.sourceURL === '' || header.sourceURL.startsWith('blob:')) {
        if (!stylesheetMap[header.styleSheetId]) {
          stylesheetMap[header.styleSheetId] = header;
          onMetaChange(stylesheetMap);
        }
      } else if (header.sourceURL) {
        if (!stylesheetMap[header.styleSheetId]) {
          stylesheetMap[header.styleSheetId] = header;
          onMetaChange(stylesheetMap);
        }
      }
    }
  });

  await win.webContents.debugger.sendCommand('Page.enable');
  await win.webContents.debugger.sendCommand('DOM.enable');
  await win.webContents.debugger.sendCommand('CSS.enable');
  await win.webContents.debugger.sendCommand('CSS.startRuleUsageTracking');

  return {
    takeCoverageDelta,
  };
};
