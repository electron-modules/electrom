'use strict';

const _ = require('lodash');
const path = require('path');
const { promises: fs } = require('fs');
const EventEmitter = require('events');
const { app, webContents } = require('electron');

const Reporter = require('./reporter');
const { listProcesses } = require('./ps');
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

  stop () {
    if (this._timer) {
      clearInterval(this._timer);
    }
  }

  start () {
    this.stop();
    this._timer = setInterval(() => this.refreshData(), this.options.threshold);

    // 前端页面更快的更新到数据
    this.refreshData();
  }

  /**
   * 发送新的数据到前端
   */
  async refreshData () {
    const data = await this.getAppMetrics();
    this.dump(data);
    this.emit(EVENT_DATA_CHANNEL_NAME, data);
  }

  async dump (data) {
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

  setOptions (options = {}) {
    this.options = Object.assign(this.options, options);
    if (this.options.dumpDir) {
      this.start();
    }
  }

  async getAppMetrics () {
    const rootPid = process.pid;
    const processMap = await listProcesses(rootPid);

    const allWebContents = webContents.getAllWebContents();
    const webContentInfos = allWebContents.map(webContentInfo => {
      return {
        type: webContentInfo.getType(),
        id: webContentInfo.id,
        pid: webContentInfo.getOSProcessId(),
        url: webContentInfo.getURL(),
      };
    });

    return app.getAppMetrics().map(appMetric => {
      const processDetail = _.pick(processMap.get(appMetric.pid), ['load', 'cmd']);
      const webContentInfo = webContentInfos.find(webContentInfo => webContentInfo.pid === appMetric.pid);

      return {
        ...appMetric,
        ...processDetail,
        webContentInfo,
      };
    });
  }

  bindEventToWindow (win) {
    if (!win || !win.webContents) return;
    win.webContents.on('ipc-message', (_, eventName, ...args) => {
      if (eventName === EVENT_ACTION_CHANNEL_NAME) {
        const action = args[0];
        const params = args[1];
        if (action === 'openDevTools') {
          const webContent = webContents.fromId(params.id);
          if (webContent) {
            webContent.openDevTools();
          }
        } else if (action === 'killProcess') {
          process.kill(params.pid);
        }
      }
    });
  }
}

Monitor.Reporter = Reporter;

Monitor.EVENT_DATA_CHANNEL_NAME = EVENT_DATA_CHANNEL_NAME;
Monitor.EVENT_ACTION_CHANNEL_NAME = EVENT_ACTION_CHANNEL_NAME;

module.exports = Monitor;
