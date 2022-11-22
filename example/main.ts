import url from 'url';
import WindowManager from 'electron-windows';
import { app } from 'electron';
import { waitPort } from 'detect-port';
import pkg from '../package.json';
import {
  Monitor,
  // PerfTracing,
  EVENT_ACTION_CHANNEL_NAME, EVENT_DATA_CHANNEL_NAME,
  BROWSER_WINDOW_PRELOAD_PATH,
} from '../src/main';

const webpackPort = 8080;

function getMainUrl() {
  return url.format({
    protocol: 'http:',
    hostname: 'localhost',
    pathname: 'index.html',
    port: webpackPort,
    query: {
      EVENT_DATA_CHANNEL_NAME,
      EVENT_ACTION_CHANNEL_NAME,
    },
  });
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
        preload: BROWSER_WINDOW_PRELOAD_PATH,
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

  // PerfTracing({
  //   dumpTargetDir: path.join(process.cwd(), '.electrom'),
  //   partitionThreshold: 30e3,
  //   memoryDumpConfig: {
  //     triggers: [
  //       {
  //         mode: 'light',
  //         periodic_interval_ms: 10e3,
  //       },
  //     ],
  //   },
  // });
});
