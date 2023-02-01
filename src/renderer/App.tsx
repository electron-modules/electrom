import { useState } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import { PreloadElectron } from '../../src/common/window';
import {
  StatusBoard, PerfBoard,
  EVENT_DATA_CHANNEL_NAME, EVENT_ACTION_CHANNEL_NAME,
  IPC_BRIDGE_NAME,
} from '../../src/renderer';
import { waitUntil } from './util';

import 'antd/dist/antd.css';

import styles from './App.module.less';

declare global {
  interface Window {
    electron: PreloadElectron;
  }
}

const App = () => {
  const [display, setDisplay] = useState(true);
  const { ipcRenderer, shell } = getBridge();
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

const container = document.querySelector('#app');
// @ts-ignore
function getBridge() {
  const params = new URLSearchParams(location.search);
  // @ts-ignore
  return window[params.get('IPC_BRIDGE_NAME') || IPC_BRIDGE_NAME];
}

async function whenBridgeReady() {
  return await waitUntil(() => !!getBridge(), {
    ms: 1000,
    retryTime: 100,
  });
}

whenBridgeReady()
  .then(() => {
    ReactDOM.render(<App />, container);
  })
  .catch(e => {
    document.write(JSON.stringify(e, null, 2));
  });
