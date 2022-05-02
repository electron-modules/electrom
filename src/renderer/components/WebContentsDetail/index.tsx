import { Button } from 'antd';
import type { ProcessInfo } from '../../../common/interface';

import style from './index.module.less';

interface WebContentsDetailProps {
  processInfo: ProcessInfo;
  openDevTools: (info: ProcessInfo['webContentInfo']) => void;
}

export const WebContentsDetail = ({ processInfo, openDevTools }: WebContentsDetailProps) => {
  if (!processInfo || !processInfo.webContentInfo) {
    return null;
  }

  return (
    <div className={style.wrapper}>
      <div>
        <div className={style.info}>{`id: ${processInfo.webContentInfo.id} type: ${processInfo.webContentInfo.type}`}</div>
        <div className={style.detail}>{processInfo.webContentInfo.url}</div>
      </div>
      <div className={style.control}>
        <div className={style.buttons}>
          <Button size="small" onClick={() => openDevTools(processInfo.webContentInfo)}>
            devtool
          </Button>
        </div>
      </div>
    </div>
  );
};
