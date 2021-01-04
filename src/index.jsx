import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import filesize from 'filesize';
import moment from 'moment';
import PropTypes from 'prop-types';

import styles from './index.module.less';

const { ipcRenderer } = window.require('electron');

const useViewModel = (props) => {
  const [data, setData] = useState([]);
  const columns = [
    {
      title: 'PID',
      dataIndex: 'pid',
    },
    {
      title: 'type',
      dataIndex: 'type',
    },
    {
      title: 'creationTime',
      dataIndex: 'creationTime',
      sorter: (a, b) => a - b,
      render: (creationTime) => moment(creationTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'cpu',
      dataIndex: 'cpu',
      sorter: (a, b) => a - b,
      render: (cpu) => `${(cpu.percentCPUUsage * 100).toFixed(2)}%`,
    },
    {
      title: 'memory',
      dataIndex: 'memory',
      sorter: (a, b) => a - b,
      render: (memory) => filesize(memory.workingSetSize * 1024),
    },
    {
      title: 'webContent',
      dataIndex: 'webContentInfo',
      render: webContentInfo => {
        if (!webContentInfo) return null;
        return (
          <div>
            {`${webContentInfo.type}|${webContentInfo.id}|${webContentInfo.url}`}
          </div>
        );
      },
    }
  ];

  const updateAppMetrics = (_, appMetrics) => setData(appMetrics);

  const { eventChannelName } = props;
  useEffect(() => {
    ipcRenderer.on(eventChannelName, updateAppMetrics);
    return () => {
      ipcRenderer.removeListener(eventChannelName, updateAppMetrics);
    };
  }, []);
  
  return {
    state: {
      columns,
      data,
    },
  };
};

const StatusBoard = (props) => {
  const vm = useViewModel(props);
  const {
    state: { columns, data },
  } = vm;
  return (
    <div className={styles.wrapper}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
      />
    </div>
  );
}

StatusBoard.PropTypes = {
  eventChannelName: PropTypes.string,
};

export default StatusBoard;