import { useState } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import { PreloadElectron } from '../../src/common/window';
import { StatusBoard, PerfBoard, EVENT_DATA_CHANNEL_NAME, EVENT_ACTION_CHANNEL_NAME } from '../../src/renderer';

import 'antd/dist/antd.css';

import styles from './App.module.less';

declare global {
  interface Window {
    electron: PreloadElectron;
  }
}

const container = document.querySelector('#app');
const params = new URLSearchParams(location.search);
const nameSpace = params.get('ELECTROM_MONITOR_BRIDAGE_NAME');

const App = () => {
  const [display, setDisplay] = useState(true);
  // @ts-ignore
  const { ipcRenderer, shell } = window[nameSpace || 'electron'];
  if (!ipcRenderer) return null;
  return (
    <>
      <StatusBoard
        eventDataChannelName={EVENT_DATA_CHANNEL_NAME}
        eventActionChannelName={EVENT_ACTION_CHANNEL_NAME}
        ipcRenderer={ipcRenderer}
        shell={shell}
      />
      <div
        className={classnames(styles.pin, {
          [styles.hide]: !display,
        })}
      >
        <PerfBoard />
        {display ? (
          <div className={styles.close} onClick={() => setDisplay(false)}>
            x
          </div>
        ) : (
          <div className={styles.badge} onClick={() => setDisplay(true)}>
            📈
          </div>
        )}
      </div>
    </>
  );
};

ReactDOM.render(<App />, container);
