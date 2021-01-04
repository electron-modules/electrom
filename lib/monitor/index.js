'use strict';

const EventEmitter = require('events');
const { app, webContents } = require('electron');

const EVENT_DATA_CHANNEL_NAME = 'electrom:monitor:data';
const EVENT_ACTION_CHANNEL_NAME = 'electrom:monitor:action';

class Monitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = Object.assign({
      interval: 5 * 1000,
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
      this.emit(EVENT_DATA_CHANNEL_NAME, data);
    }, this.options.interval);
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
}

Monitor.EVENT_DATA_CHANNEL_NAME = EVENT_DATA_CHANNEL_NAME;
Monitor.EVENT_ACTION_CHANNEL_NAME = EVENT_ACTION_CHANNEL_NAME;

module.exports = Monitor;
