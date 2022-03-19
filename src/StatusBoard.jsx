import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import filesize from 'filesize';
import { round } from 'lodash';
import PropTypes from 'prop-types';
import { BottomPanel } from './components/BottomPanel';

import {
  EVENT_DATA_CHANNEL_NAME,
  EVENT_ACTION_CHANNEL_NAME,
} from '../lib/monitor/constants';

import styles from './StatusBoard.module.less';

/**
 * 获取进程 cmd 的简易信息
 * @param {string} cmd
 * @param {number} startIndex 是否需要截断
 * @returns string
 */
const findName = (cmd, startIndex = 0) => {
  const index = cmd.indexOf(' -');
  const end = index !== -1 ? index : cmd.length;
  if (startIndex > 0) {
    return '...' + cmd.substring(startIndex + 1, end);
  } else {
    return cmd.substring(0, end);
  }
}

/**
 * 找出相同的字符串
 * @param {string} str1
 * @param {string} str2
 * @returns number
 */
const findCommonString = (str1, str2) => {
  let index = -1;
  const minLen = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

/**
 * 从多个字符串中找到相同字符串
 * @param {string[]} strs
 * @returns number
 */
const findCommonStringPlus = (strs) => {
  if (strs.length < 2) {
    return -1;
  }

  let indexs = [];
  for (let i = 1; i < strs.length; i++) {
    indexs.push(findCommonString(strs[i - 1], strs[i]));
  }
  return Math.min(...indexs);
};

// 测试共同字符串数量
const MAX_COMMON_STRING_TEST = 3;

const useViewModel = (props) => {
  const { ipcRenderer } = props;
  const [data, setData] = useState([]);
  const [processBaseIndex, setProcessBaseIndex] = useState(-1);

  const columns = [
    {
      title: 'Process',
      dataIndex: 'cmd',
      render: (cmd) => findName(cmd, processBaseIndex),
      fixed: 'right',
    },
    {
      title: 'type',
      dataIndex: 'type',
      width: '80px',
      filters: Array.from(new Set(data.map(item => item.type))).map(item => {
        return {
          text: item,
          value: item,
        };
      }),
      defaultFilteredValue: [],
      onFilter: (value, record) => record.type === value,
      ellipsis: true,
      filterMultiple: false,
      fixed: 'right',
    },
    {
      title: 'load',
      dataIndex: 'load',
      sorter: (a, b) => a - b,
      render: (load) => load,
      width: '60px',
      fixed: 'right',
    },
    {
      title: 'CPU(%)',
      dataIndex: 'cpu',
      sorter: (a, b) => a.cpu.percentCPUUsage - b.cpu.percentCPUUsage,
      render: (cpu) => round(cpu.percentCPUUsage * 10, 2),
      width: '80px',
      fixed: 'right',
    },
    {
      title: 'working',
      dataIndex: 'memory',
      sorter: (a, b) => a.memory.workingSetSize - b.memory.workingSetSize,
      render: (memory) => filesize(memory.workingSetSize * 1024),
      width: '100px',
      fixed: 'right',
    },
    {
      title: 'peak',
      dataIndex: 'memory',
      sorter: (a, b) => a.memory.peakWorkingSetSize - b.memory.peakWorkingSetSize,
      render: (memory) => filesize(memory.peakWorkingSetSize * 1024),
      width: '100px',
      fixed: 'right',
    },
    {
      title: 'PID',
      dataIndex: 'pid',
      width: '65px',
      fixed: 'right',
    },
  ];

  const updateAppMetrics = (_, appMetrics) => {
    const list = Array.isArray(appMetrics) ? appMetrics : [];
    if (list.length > MAX_COMMON_STRING_TEST) {
      setProcessBaseIndex(findCommonStringPlus(list.map(item => item.cmd)));
    }

    setData(list);
  };

  useEffect(() => {
    ipcRenderer.on(props.eventDataChannelName, updateAppMetrics);
    return () => {
      ipcRenderer.removeListener(props.eventDataChannelName, updateAppMetrics);
    };
  }, []);

  useEffect(() => {
  }, [data]);

  return {
    state: {
      columns,
      data,
    },
  };
};

const StatusBoard = (props) => {
  const vm = useViewModel(props);
  const { state: { columns, data } } = vm;
  const [selectedProcess, setSelectedProcess] = useState(null);

  return (
    <div className={styles.wrapper}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        tableLayout="fixed"
        rowKey={'pid'}
        bordered={false}
        onRow={(record) => ({
          onClick: () => {
            setSelectedProcess(record);
          },
        })}
      />
      <BottomPanel processInfo={selectedProcess} ipcRenderer={props.ipcRenderer} eventActionChannelName={props.eventActionChannelName} />
    </div>
  );
}

StatusBoard.defaultProps = {
  eventDataChannelName: EVENT_DATA_CHANNEL_NAME,
  eventActionChannelName: EVENT_ACTION_CHANNEL_NAME,
};

StatusBoard.PropTypes = {
  eventDataChannelName: PropTypes.string.isRequired,
  eventActionChannelName: PropTypes.string.isRequired,
  ipcRenderer: PropTypes.object,
  shell: PropTypes.object,
};

export default StatusBoard;