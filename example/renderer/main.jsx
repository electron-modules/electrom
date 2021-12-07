import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import 'antd/dist/antd.css';
import StatusBoard from '../../src/StatusBoard';
import PerfBoard from '../../src/PerfBoard';
import styles from './main.module.less';

const container = document.querySelector('#app');

const params = new URLSearchParams(location.search);
const { ipcRenderer, shell } = window.electron;

const Main = () => {
  const [display, setDisplay] = useState(true);
  return (
    <>
      <StatusBoard
        eventDataChannelName={params.get('EVENT_DATA_CHANNEL_NAME')}
        eventActionChannelName={params.get('EVENT_ACTION_CHANNEL_NAME')}
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
          <div
            className={styles.close}
            onClick={() => setDisplay(false)}
          >
            x
          </div>
        ) : (
          <div
            className={styles.badge}
            onClick={() => setDisplay(true)}
          >
            📈
          </div>
        )}
      </div>
    </>
  );
};

ReactDOM.render(<Main />, container);
