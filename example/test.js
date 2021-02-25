'use strict';

const { BrowserWindow, app } = require('electron');

// https://chromedevtools.github.io/devtools-protocol/tot/CSS/

const takeCoverageDelta = async (win) => {
  const res = await win.webContents.debugger.sendCommand('CSS.takeCoverageDelta');
  if (res.coverage.length) {
    for (const item of res.coverage) {
      const { styleSheetId, startOffset, endOffset } = item;
      const { text } = await win.webContents.debugger.sendCommand('CSS.getStyleSheetText', {
        styleSheetId,
      });
      // console.log(text);
      console.log(text.slice(startOffset, endOffset));
    }
  }
};

app.whenReady().then(async () => {
  const { BrowserWindow } = require('electron')
  const win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
    }
  });
  try {
    win.webContents.debugger.attach()
  } catch (err) {
    console.log('Debugger attach failed : ', err)
  }

  win.webContents.debugger.on('detach', (event, reason) => {
    console.log('Debugger detached due to : ', reason)
  });

  win.webContents.debugger.on('message', (event, method, params) => {
    console.log(method);
  });
  win.loadURL('http://localhost:8080/test/fixture');
  await win.webContents.debugger.sendCommand('Page.enable');
  await win.webContents.debugger.sendCommand('DOM.enable');
  await win.webContents.debugger.sendCommand('CSS.enable');
  await win.webContents.debugger.sendCommand('CSS.startRuleUsageTracking');
  
  setInterval(() => {
    takeCoverageDelta(win);
  }, 5000);
});