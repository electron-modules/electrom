import React from 'react';
import { Tabs } from 'antd';
import { ProcessDetail } from '../ProcessDetail';
import { WebContentsDetail } from '../WebContentsDetail';

import style from './index.module.less';

export const BottomPanel = ({ processInfo, ipcRenderer, eventActionChannelName }) => {
  if (!processInfo) {
    return null;
  }
  const openDevTools = webContentInfo => {
    ipcRenderer.send(eventActionChannelName, 'openDevTools', webContentInfo);
  };

  const killProcess = item => {
    ipcRenderer.send(eventActionChannelName, 'killProcess', item);
  };

  return <>
    <div className={style.bottom_info}>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Process" key="Process">
          <ProcessDetail processInfo={processInfo} killProcess={killProcess} />
        </Tabs.TabPane>
        {processInfo.webContentInfo && (
          <Tabs.TabPane tab="WebContents" key="WebContents">
            <WebContentsDetail processInfo={processInfo} openDevTools={openDevTools} />
          </Tabs.TabPane>
        )}
      </Tabs>
    </div>
  </>
}