import url from 'url';
import path from 'path';
import WindowManager from 'electron-windows';
import { app } from 'electron';
import { waitPort } from 'detect-port';
import { Monitor, PerfTracing, EVENT_ACTION_CHANNEL_NAME, EVENT_DATA_CHANNEL_NAME } from '../src/main';

const monitor = new Monitor();

const mainUrl = url.format({
  pathname: path.join(__dirname, 'renderer', 'index.html'),
  protocol: 'file:',
  query: {
    EVENT_DATA_CHANNEL_NAME,
    EVENT_ACTION_CHANNEL_NAME,
  },
});

app.on('ready', async () => {
  // wait for the port 8000 to be ready
  await waitPort(8080);

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
        preload: path.join(__dirname, 'renderer', 'preload.js'),
      },
    },
  });

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
