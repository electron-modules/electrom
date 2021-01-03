'use strict';

const url = require('url');
const path = require('path');
const WindowManager = require('electron-windows');
const { app, webContents } = require('electron');
const _ = require('lodash');

const mainUrl = url.format({
  pathname: path.join(__dirname, 'renderer', 'main.html'),
  protocol: 'file:',
});

app.on('ready', () => {
  const windowManager = new WindowManager();
  const win = windowManager.create({
    name: 'main',
    browserWindow: {
      width: 1280,
      height: 800,
      title: 'electrom',
      show: false,
      acceptFirstMouse: true,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: true,
        webviewTag: true,
      },
    },
  });
  win.loadURL(mainUrl);
  win.once('ready-to-show', () => {
    win.show();
  });
  setInterval(() => {
    const allWebContents = webContents.getAllWebContents();
    const webContentsInfo = allWebContents.map(webContentInfo => ({
      type: webContentInfo.getType(),
      id: webContentInfo.id,
      pid: webContentInfo.getOSProcessId(),
      url: webContentInfo.getURL(),
    }));
    const appMetrics = app.getAppMetrics()
      .map(appMetric => {
        const webContentInfo = webContentsInfo.find(webContentInfo => webContentInfo.pid === appMetric.pid);
        if (!webContentInfo) return appMetric;
        return {
          ...appMetric,
          webContentInfo,
        };
      });
    win.webContents.send('electrom:appmetrics', appMetrics);
  }, 3000);
});
