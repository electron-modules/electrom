import path from 'path';
import fs from 'fs';
import { promises as fsp } from 'fs';
import url from 'url';
import { app, BrowserWindow } from 'electron';
import { waitPort } from 'detect-port';
import {
  Monitor,
  PerfTracing,
  pickDataFromDir,
  genTextReporter,
  renderHtmlReporter,
  EVENT_ACTION_CHANNEL_NAME,
  EVENT_DATA_CHANNEL_NAME,
  BROWSER_WINDOW_PRELOAD_PATH,
  BROWSER_WINDOW_ASSETS_PATH,
} from '../src/main';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const webpackPort = 8080;
const dumpDir = path.join(__dirname, '.electrom-dumps');

function getRendererUrl() {
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

function createBrowserWindow(opts: Electron.BrowserWindowConstructorOptions = {}) {
  return new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    acceptFirstMouse: true,
    webPreferences: {
      // BROWSER_WINDOW_PRELOAD_PATH bridges IPC between main process and
      // renderer (exposes window.electron.ipcRenderer).
      preload: BROWSER_WINDOW_PRELOAD_PATH,
    },
    ...opts,
  });
}

app.on('ready', async () => {
  await fsp.mkdir(dumpDir, { recursive: true });
  await waitPort(webpackPort);

  // ───────────────────────────────────────────────────────────────────────────
  // Section 1 ─ Dedicated electrom Dashboard window (built-in UI)
  //
  // BROWSER_WINDOW_ASSETS_PATH is a file:// URL pointing to the built-in
  // electrom dashboard page (dist/index.html). No extra renderer setup needed.
  // ───────────────────────────────────────────────────────────────────────────
  const dashboardWin = createBrowserWindow({ width: 1280, height: 600 });
  dashboardWin.loadURL(BROWSER_WINDOW_ASSETS_PATH);

  // ───────────────────────────────────────────────────────────────────────────
  // Section 2 ─ Monitor: collect metrics + dump snapshots to local disk
  //
  // `threshold`    – polling interval in ms (default 5000)
  // `dumpDir`      – write a timestamped JSON snapshot on every poll
  // `dumpThreshold`– minimum gap between writes (default 10000 ms)
  // ───────────────────────────────────────────────────────────────────────────
  const monitor = new Monitor({
    threshold: 5_000,
    dumpDir,
    dumpThreshold: 10_000,
  });

  // You can also change options after construction:
  // monitor.setOptions({ threshold: 3_000 });

  // Start collecting metrics immediately — independent of any window loading.
  monitor.start();

  // Use named listener functions so each window's subscription can be cleanly
  // removed when that window closes, without affecting other windows.
  const onDashboardData = (data: any) => {
    if (!dashboardWin.isDestroyed() && !dashboardWin.webContents.isDestroyed()) {
      dashboardWin.webContents.send(EVENT_DATA_CHANNEL_NAME, data);
    }
  };

  // Use `once` to avoid stacking duplicate listeners if the page navigates.
  dashboardWin.webContents.once('dom-ready', () => {
    monitor.on(EVENT_DATA_CHANNEL_NAME, onDashboardData);
    // Allow the dashboard to send actions back to main (openDevTools, killProcess, openExternal).
    monitor.bindEventToWindow(dashboardWin);
  });

  dashboardWin.on('closed', () => monitor.removeListener(EVENT_DATA_CHANNEL_NAME, onDashboardData));
  dashboardWin.once('ready-to-show', () => dashboardWin.show());

  // ───────────────────────────────────────────────────────────────────────────
  // Section 3 ─ Main application window (your own renderer page)
  //
  // This window uses BROWSER_WINDOW_PRELOAD_PATH so it can receive
  // EVENT_DATA_CHANNEL_NAME and render the PerfBoard FPS/memory overlay.
  //
  // `bindEventToWindow` is called here too so the renderer can trigger actions
  // like openDevTools and killProcess from within the app's own UI if desired.
  // ───────────────────────────────────────────────────────────────────────────
  const mainWin = createBrowserWindow();
  mainWin.loadURL(getRendererUrl());

  const onMainWinData = (data: any) => {
    if (!mainWin.isDestroyed() && !mainWin.webContents.isDestroyed()) {
      mainWin.webContents.send(EVENT_DATA_CHANNEL_NAME, data);
    }
  };

  mainWin.webContents.once('dom-ready', () => {
    monitor.on(EVENT_DATA_CHANNEL_NAME, onMainWinData);
    monitor.bindEventToWindow(mainWin);
  });

  mainWin.on('closed', () => monitor.removeListener(EVENT_DATA_CHANNEL_NAME, onMainWinData));
  mainWin.once('ready-to-show', () => mainWin.show());

  // ───────────────────────────────────────────────────────────────────────────
  // Section 4 ─ PerfTracing: continuous Chrome content tracing
  //
  // Captures CPU / memory traces using Chromium's tracing infrastructure.
  // Each partition writes a .json file openable in chrome://tracing or Perfetto.
  // ───────────────────────────────────────────────────────────────────────────
  PerfTracing({
    dumpTargetDir: dumpDir,
    partitionThreshold: 30_000, // rotate every 30 s
    memoryDumpConfig: {
      triggers: [{ mode: 'light', periodic_interval_ms: 10_000 }],
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 ─ Offline Reporter: generate a performance summary on exit
//
// Reads all JSON snapshots written by Monitor's dumpDir, then:
//   - prints a plain-text avg/max/min table to stdout
//   - writes an HTML report to dumpDir/report.html (open in any browser)
//
// Note: `before-quit` handlers must be synchronous — Electron does not await
// Promises returned from event listeners, so we use synchronous fs APIs here.
// ─────────────────────────────────────────────────────────────────────────────
app.on('before-quit', () => {
  try {
    const snapshots = pickDataFromDir(dumpDir);
    if (!snapshots.length) return;

    const { str } = genTextReporter(snapshots);
    console.log('\n[electrom] Performance summary:\n', str);

    const html = renderHtmlReporter(snapshots);
    const reportPath = path.join(dumpDir, 'report.html');
    fs.writeFileSync(reportPath, html, 'utf8');
    console.log(`[electrom] HTML report saved to: ${reportPath}`);
  } catch (e) {
    console.error('[electrom] Reporter error:', e);
  }
});
