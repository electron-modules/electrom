'use strict';

const url = require('url');
const path = require('path');
const WindowManager = require('electron-windows');
const { app } = require('electron');
const { Monitor } = require('..');

const monitor = new Monitor({
  interval: 1000,
});

const { EVENT_CHANNEL_NAME: MONITOR_EVENT_CHANNEL_NAME } = Monitor;

const mainUrl = url.format({
  pathname: path.join(__dirname, 'renderer', 'main.html'),
  protocol: 'file:',
  query: {
    MONITOR_EVENT_CHANNEL_NAME: MONITOR_EVENT_CHANNEL_NAME,
  },
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
    monitor.on(MONITOR_EVENT_CHANNEL_NAME, (data) => {
      win.webContents.send(MONITOR_EVENT_CHANNEL_NAME, data);
    });
    monitor.start();
  });
});
