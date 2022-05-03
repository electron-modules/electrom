import { useState, useEffect } from 'react';
import { Button, Table } from 'antd';
import fileSize from 'filesize';
import { round } from 'lodash';
import { ColumnsType } from 'antd/lib/table';
import type { PreloadElectron } from 'src/common/window';
import { BottomPanel } from './components/BottomPanel';
import { EVENT_DATA_CHANNEL_NAME, EVENT_ACTION_CHANNEL_NAME } from '../common/constants';

import styles from './StatusBoard.module.less';
import type { ProcessInfo } from '../common/interface';
import { findCommonStringPlus, findName, isWindows } from './util';

interface MemoryStats {
  workingSetSize: number;
  peakWorkingSetSize: number;
}

interface CpuStatus {
  percentCPUUsage: number;
}

// 测试共同字符串数量
const MAX_COMMON_STRING_TEST = 3;

const useViewModel = (props: StatusBoardProps) => {
  const { ipcRenderer } = props;
  const [data, setData] = useState<ProcessInfo[]>([]);
  const [processBaseIndex, setProcessBaseIndex] = useState(-1);
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo>();

  const openDevTools = (webContentInfo: ProcessInfo['webContentInfo']) => {
    ipcRenderer.send(props.eventActionChannelName, 'openDevTools', webContentInfo);
  };

  const columns: ColumnsType<ProcessInfo> = [
    {
      title: 'Process',
      dataIndex: 'cmd',
      render: (cmd: string) => findName(cmd, processBaseIndex),
      fixed: 'right',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '80px',
      filters: Array.from(new Set(data.map((item) => item.type))).map((item) => {
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
      title: 'CPU(%)',
      dataIndex: 'cpu',
      sorter: (a, b) => a.cpu.percentCPUUsage - b.cpu.percentCPUUsage,
      render: (cpu: CpuStatus) => round(cpu.percentCPUUsage * 10, 2),
      width: '80px',
      fixed: 'right',
    },
    {
      title: 'Working',
      dataIndex: 'memory',
      sorter: (a, b) => a.memory.workingSetSize - b.memory.workingSetSize,
      render: (memory: MemoryStats) => fileSize(memory.workingSetSize * 1024),
      width: '100px',
      fixed: 'right',
    },
    {
      title: 'Peak',
      dataIndex: 'memory',
      sorter: (a, b) => a.memory.peakWorkingSetSize - b.memory.peakWorkingSetSize,
      render: (memory: MemoryStats) => fileSize(memory.peakWorkingSetSize * 1024),
      width: '100px',
      fixed: 'right',
    },
    {
      title: 'PID',
      dataIndex: 'pid',
      width: '65px',
      fixed: 'right',
    },
    {
      title: 'Action',
      dataIndex: 'type',
      width: '90px',
      fixed: 'right',
      render: (type: string, item) => {
        const isDevtoolsSelf = !!item.webContentInfo?.url.startsWith('devtools://devtools');
        if (type === 'Tab' && !isDevtoolsSelf) {
          return (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openDevTools(item.webContentInfo);
              }}
            >
              devtool
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const updateAppMetrics = (_: any, appMetrics: any[]) => {
    const list = Array.isArray(appMetrics) ? appMetrics : [];
    if ((list.length > MAX_COMMON_STRING_TEST) && !isWindows()) {
      setProcessBaseIndex(findCommonStringPlus(list.map((item) => item.cmd)));
    }

    setData(list);
  };

  useEffect(() => {
    ipcRenderer.on(props.eventDataChannelName, updateAppMetrics);
    return () => {
      ipcRenderer.removeListener(props.eventDataChannelName, updateAppMetrics);
    };
  }, [ipcRenderer, props.eventDataChannelName]);

  return {
    state: {
      columns,
      data,
      selectedProcess,
    },
    actions: {
      setSelectedProcess,
    },
  };
};

interface StatusBoardProps {
  shell: PreloadElectron['shell'];
  ipcRenderer: PreloadElectron['ipcRenderer'];
  eventActionChannelName: string;
  eventDataChannelName: string;
}

export const StatusBoard = (props: StatusBoardProps) => {
  const {
    state: { columns, data, selectedProcess },
    actions: { setSelectedProcess },
  } = useViewModel(props);

  return (
    <div className={styles.wrapper}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        tableLayout="fixed"
        rowKey="pid"
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
};

StatusBoard.defaultProps = {
  eventActionChannelName: EVENT_ACTION_CHANNEL_NAME,
  eventDataChannelName: EVENT_DATA_CHANNEL_NAME,
};

export default StatusBoard;
