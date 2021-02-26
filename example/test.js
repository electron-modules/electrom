'use strict';

const fs = require('fs');
const path = require('path');
const { BrowserWindow, app } = require('electron');

// https://chromedevtools.github.io/devtools-protocol/tot/CSS/

const attachDebuggerToWindow = async (win, options = {}) => {
  const {
    onCoverageChange,
    onMetaChange,
  } = options;
  try {
    win.webContents.debugger.attach('1.3')
  } catch (err) {
    console.log('Debugger attach failed : ', err)
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

  setInterval(() => {
    takeCoverageDelta();
  }, 5000);

  await win.webContents.debugger.sendCommand('Page.enable');
  await win.webContents.debugger.sendCommand('DOM.enable');
  await win.webContents.debugger.sendCommand('CSS.enable');
  await win.webContents.debugger.sendCommand('CSS.startRuleUsageTracking');
};
const dataDir = path.join(process.cwd(), 'data');

app.whenReady()
  .then(() => {
    const win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: false,
      }
    });

    attachDebuggerToWindow(win, {
      onMetaChange: (data) => {
        fs.writeFileSync('meta.json', JSON.stringify(data, null, 2));
      },
      onCoverageChange: (data) => {
        const {
          coverage,
          timestamp,
        } = data;
        const file = path.join(dataDir, `${timestamp}.json`);
        fs.writeFileSync(file, JSON.stringify(coverage, null, 2), 'utf-8');
      },
    });

    win.loadURL('http://localhost:8080/test/fixture');
  });