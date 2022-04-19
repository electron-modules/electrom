import { Button } from 'antd';
import type { ProcessInfo } from 'src/common/interface';

import style from './index.module.less';

interface ProcessDetailProps {
  processInfo: ProcessInfo;
  killProcess: (processInfo: ProcessInfo) => void;
}

export const ProcessDetail = ({ processInfo, killProcess }: ProcessDetailProps) => {
  if (!processInfo) {
    return null;
  }

  return (
    <div className={style.wrapper}>
      <div className={style.detail}>{processInfo.cmd}</div>
      <div className={style.control}>
        <div className={style.buttons}>
          <Button size="small" onClick={() => killProcess(processInfo)}>
            kill
          </Button>
        </div>
      </div>
    </div>
  );
};
