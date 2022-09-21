import { pick } from 'lodash';
import { join } from 'path';
import { promises as fs } from 'fs';
import { EventEmitter } from 'events';
import { app, BrowserWindow, webContents } from 'electron';

import { listProcesses } from './ps';
import { EVENT_DATA_CHANNEL_NAME, EVENT_ACTION_CHANNEL_NAME } from '../../common/constants';
import { ProcessInfo } from '../../common/interface';

export * from './reporter';
export * from '../../common/constants';

interface MonitorOptions {
  threshold?: number;
  dumpDir?: string | null;
  dumpThreshold?: number;
}

export class Monitor extends EventEmitter {
  options: MonitorOptions;

  _timer?: ReturnType<typeof setTimeout>;

  _latestDumpTimeStamp?: number;

  constructor(options: MonitorOptions = {}) {
    super();
    this.options = {
      threshold: 5e3,
      dumpDir: null,
      dumpThreshold: 10e3,
      ...options,
    };
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
    }
  }

  start() {
    this.stop();

    this._timer = setInterval(() => this.refreshData(), this.options.threshold);

    // 前端页面更快的更新到数据
    this.refreshData();
  }

  /**
   * 发送新的数据到前端
   */
  async refreshData() {
    const data = await this.getAppMetricsAndProcess();
    this.dump(data);
    this.emit(EVENT_DATA_CHANNEL_NAME, data);
  }

  async dump(data: ProcessInfo[]) {
    const { dumpDir, dumpThreshold } = this.options;
    if (!dumpDir) return;
    const now = Date.now();
    if (this._latestDumpTimeStamp && dumpThreshold && now - this._latestDumpTimeStamp < dumpThreshold) {
      return;
    }

    this._latestDumpTimeStamp = now;
    const fileName = join(dumpDir, `${now}.json`);
    await fs.writeFile(fileName, JSON.stringify(data), 'utf8');
  }

  setOptions(options = {}) {
    this.options = Object.assign(this.options, options);
    if (this.options.dumpDir) {
      this.start();
    }
  }

  async getAppMetrics() {
    const allWebContents = webContents.getAllWebContents();
    const webContentInfos = allWebContents.map((webContentInfo) => {
      return {
        type: webContentInfo.getType(),
        id: webContentInfo.id,
        pid: webContentInfo.getOSProcessId(),
        url: webContentInfo.getURL(),
      };
    });

    return app.getAppMetrics().map((appMetric) => {
      const webContentInfo = webContentInfos.find((webContentInfo) => webContentInfo.pid === appMetric.pid);

      return {
        ...appMetric,
        webContentInfo,
      };
    });
  }
  async getAppMetricsAndProcess() {
    const rootPid = process.pid;
    const processMap = await listProcesses(rootPid);

    const appMetrics = await this.getAppMetrics();

    return appMetrics.map((appMetric) => {
      const processDetail = pick(processMap.get(appMetric.pid), ['cmd']);

      return {
        ...appMetric,
        ...processDetail,
      };
    });
  }

  bindEventToWindow(win: BrowserWindow) {
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
