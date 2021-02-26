'use strict';

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
    // console.log(coverage.length, timestamp)
    if (coverage.length) {
      for (const cov of coverage) {
        const { styleSheetId, startOffset, endOffset } = cov;
        const { text } = await win.webContents.debugger.sendCommand('CSS.getStyleSheetText', {
          styleSheetId,
        });
        console.log(text.slice(startOffset, endOffset));
        const str1 = text.slice(0, startOffset);
        const str2 = text.slice(startOffset, endOffset);
        const startLine = str1.split('\n').length;
        const endLine = startLine + str2.split('\n').length;
        console.log({
          startLine,
          endLine,
        });
      }
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
        // console.log(data);
      },
      onCoverageChange: (data) => {
        // console.log(data);
      },
    });

    win.loadURL('http://localhost:8080/test/fixture');
  });