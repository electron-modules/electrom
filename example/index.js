'use strict';

const url = require('url');
const path = require('path');
const WindowManager = require('electron-windows');
const { app, webContents } = require('electron');
const { Monitor } = require('..');

const monitor = new Monitor({
  interval: 3 * 1000,
});

const {
  EVENT_DATA_CHANNEL_NAME,
  EVENT_ACTION_CHANNEL_NAME,
} = Monitor;

const mainUrl = url.format({
  pathname: path.join(__dirname, 'renderer', 'main.html'),
  protocol: 'file:',
  query: {
    EVENT_DATA_CHANNEL_NAME,
    EVENT_ACTION_CHANNEL_NAME,
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
    monitor.on(EVENT_DATA_CHANNEL_NAME, (data) => {
      win.webContents.send(EVENT_DATA_CHANNEL_NAME, data);
    });
    monitor.bindEventToWindow(win);
    monitor.start();
  });
});
