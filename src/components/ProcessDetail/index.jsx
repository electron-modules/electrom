import React from 'react';
import { Button } from 'antd';

import style from './index.module.less';

export const ProcessDetail = ({ processInfo, killProcess }) => {
  if (!processInfo) {
    return null;
  }

  return <div className={style.wrapper}>
    <div className={style.detail}>
      {processInfo.cmd}
    </div>
    <div className={style.control}>
      <div className={style.buttons}>
        <Button
          size="small"
          onClick={() => killProcess(processInfo)}
        >
          kill
        </Button>
      </div>
    </div>
  </div >;
}