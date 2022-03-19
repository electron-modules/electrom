import React from 'react';
import { Divider, Button } from 'antd';

import style from './index.module.less';

export const WebContentsDetail = ({ processInfo, openDevTools }) => {
  if (!processInfo || !processInfo.webContentInfo) {
    return null;
  }

  return <div className={style.wrapper}>
    <div>
      <div className={style.info}>id: {processInfo.webContentInfo.id} type: {processInfo.webContentInfo.type}</div>
      <div className={style.detail}>{processInfo.webContentInfo.url}</div>
    </div>
    <div className={style.control}>
      <div className={style.buttons}>
        <Button
          size="small"
          onClick={() => openDevTools(processInfo.webContentInfo)}
        >
          devtool
        </Button>
      </div>
    </div>
  </div >;
}