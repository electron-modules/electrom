'use strict';

const { promises: fs } = require('fs');
const path = require('path');
const EventEmitter = require('events');
const { app, webContents } = require('electron');
const { EVENT_DATA_CHANNEL_NAME, EVENT_ACTION_CHANNEL_NAME } = require('./constants');

class Monitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = Object.assign({
      threshold: 5E3,
      dumpDir: null,
      dumpThreshold: 10E3,
    }, options);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
    }
  }

  start() {
    this.stop();
    this._timer = setInterval(() => {
      const data = this.getAppMetrics();
      this.dump(data);
      this.emit(EVENT_DATA_CHANNEL_NAME, data);
    }, this.options.threshold);
  }

  async dump(data) {
    const { dumpDir, dumpThreshold } = this.options;
    if (!dumpDir) return;
    const now = Date.now();
    if (this._latestDumpTimeStamp && (now - this._latestDumpTimeStamp < dumpThreshold)) {
      return;
    }
    this._latestDumpTimeStamp = now;
    const fileName = path.join(dumpDir, `${now}.json`);
    await fs.writeFile(fileName, JSON.stringify(data), 'utf8');
  }

  setOptions(options = {}) {
    this.options = Object.assign(this.options, options);
    if (this.options.dumpDir) {
      this.start();
    }
  }

  getAppMetrics() {
    const allWebContents = webContents.getAllWebContents();
    const webContentsInfo = allWebContents.map(webContentInfo => ({
      type: webContentInfo.getType(),
      id: webContentInfo.id,
      pid: webContentInfo.getOSProcessId(),
      url: webContentInfo.getURL(),
    }));
    return app.getAppMetrics()
      .map(appMetric => {
        const webContentInfo = webContentsInfo.find(webContentInfo => webContentInfo.pid === appMetric.pid);
        if (!webContentInfo) return appMetric;
        return {
          ...appMetric,
          webContentInfo,
        };
      });
  }

  bindEventToWindow(win) {
    if (!win || !win.webContents) return;
    win.webContents.on('ipc-message', (_, eventName, ...args) => {
      if (eventName === EVENT_ACTION_CHANNEL_NAME) {
        const action = args[0];
        const params = args[1];
        if (action === 'openDevTools') {
          const webContent = webContents.fromId(params.id);
          webContent.openDevTools();
        } else if (action === 'killProcess') {
          process.kill(params.pid);
        }
      }
    });
  }
}

Monitor.EVENT_DATA_CHANNEL_NAME = EVENT_DATA_CHANNEL_NAME;
Monitor.EVENT_ACTION_CHANNEL_NAME = EVENT_ACTION_CHANNEL_NAME;

module.exports = Monitor;
