import url from 'url';
import path from 'path';
import WindowManager from 'electron-windows';
import { app } from 'electron';
import { waitPort } from 'detect-port';
import pkg from '../package.json';
import {
  Monitor, PerfTracing,
  EVENT_ACTION_CHANNEL_NAME, EVENT_DATA_CHANNEL_NAME,
} from '../src/main';

const webpackPort = 8080;

function getMainUrl() {
  const mainUrl = url.format({
    protocol: 'http:',
    hostname: 'localhost',
    pathname: 'index.html',
    port: webpackPort,
    query: {
      EVENT_DATA_CHANNEL_NAME,
      EVENT_ACTION_CHANNEL_NAME,
    },
  });
  return mainUrl;
}

app.on('ready', async () => {
  await waitPort(webpackPort);

  const monitor = new Monitor();

  const windowManager = new WindowManager();
  const win = windowManager.create({
    name: 'main',
    browserWindow: {
      width: 1280,
      height: 800,
      title: pkg.name,
      show: false,
      acceptFirstMouse: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    },
  });

  const mainUrl = getMainUrl();
  console.log('load url: %s', mainUrl);

  win.loadURL(mainUrl);
  win.webContents.openDevTools({ mode: 'detach' });
  win.webContents.on('dom-ready', () => {
    monitor.on(EVENT_DATA_CHANNEL_NAME, (data: any) => {
      win.webContents.send(EVENT_DATA_CHANNEL_NAME, data);
    });
    monitor.bindEventToWindow(win);
    monitor.start();
  });
  win.once('ready-to-show', () => {
    win.show();
  });

  PerfTracing({
    dumpTargetDir: path.join(process.cwd(), '.electrom'),
    partitionThreshold: 30e3,
    memoryDumpConfig: {
      triggers: [
        {
          mode: 'light',
          periodic_interval_ms: 10e3,
        },
      ],
    },
  });
});
