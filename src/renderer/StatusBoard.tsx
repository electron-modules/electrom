import { useState, useEffect } from 'react';
import { Table, Tooltip } from 'antd';
import fileSize from 'filesize';
import { round, sumBy } from 'lodash';
import { ColumnsType } from 'antd/lib/table';
import type { PreloadElectron } from 'src/common/window';
import { StopOutlined, BugOutlined } from '@ant-design/icons';
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

const Footer = (props: any) => {
  return (
    <footer>
      <a
        onClick={e => {
          e.preventDefault();
          props.ipcRenderer.send(props.eventActionChannelName, 'openExternal', 'https://github.com/electron-modules/electrom');
        }}
      >
        Electrom
      </a>
    </footer>
  );
};

const useViewModel = (props: StatusBoardProps) => {
  const { ipcRenderer } = props;
  const [data, setData] = useState<ProcessInfo[]>([]);
  const [processBaseIndex, setProcessBaseIndex] = useState(-1);
  const [selectedProcess, setSelectedProcess] = useState<ProcessInfo>();

  const openDevTools = (webContentInfo: ProcessInfo['webContentInfo']) => {
    ipcRenderer.send(props.eventActionChannelName, 'openDevTools', webContentInfo);
  };

  const killProcess = (item: ProcessInfo) => {
    ipcRenderer.send(props.eventActionChannelName, 'killProcess', item);
  };

  function getTotalMemorySize(_data: ProcessInfo[], key: String) {
    // @ts-ignore
    const total = sumBy(_data, item => item.memory[key]);
    return fileSize(total * 1024);
  }

  function getTotalCPU(_data: ProcessInfo[]) {
    const total = sumBy(_data, item => item.cpu.percentCPUUsage);
    return round(total * 10, 2);
  }

  const columns: ColumnsType<ProcessInfo> = [
    {
      title: 'Process',
      dataIndex: 'cmd',
      render: (cmd: string, item) => {
        const { webContentInfo } = item;
        if (!webContentInfo) {
          return <div>{findName(cmd, processBaseIndex)}</div>;
        }
        let display = [];
        try {
          const urlObj = new URL(webContentInfo.url);
          if (urlObj.hash) {
            display.push(urlObj.hash);
          }
          if (urlObj.protocol) {
            display.push(
              <Tooltip placement="bottom" title={webContentInfo.url}>
                {urlObj.protocol}
              </Tooltip>,
            );
          }
        } catch (_) {}
        return (
          <>
            <div>{findName(cmd, processBaseIndex)}</div>
            <span className={styles.desc}>
              <span>id:{webContentInfo.id}</span>
              <span>type:{webContentInfo.type}</span>
              {display.map((textOrElement, index) => (
                <span key={index}>{textOrElement}</span>
              ))}
            </span>
          </>
        );
      },
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
      title: (
        <div className={styles.columnTitle}>
          CPU
          <div className={styles.value}>
            {getTotalCPU(data)}%
          </div>
        </div>
      ),
      dataIndex: 'cpu',
      sorter: (a, b) => a.cpu.percentCPUUsage - b.cpu.percentCPUUsage,
      render: (cpu: CpuStatus) => round(cpu.percentCPUUsage * 10, 2),
      width: '80px',
      fixed: 'right',
    },
    {
      title: (
        <div className={styles.columnTitle}>
          Working
          <div className={styles.value}>
            {getTotalMemorySize(data, 'workingSetSize')}
          </div>
        </div>
      ),
      dataIndex: 'memory',
      sorter: (a, b) => a.memory.workingSetSize - b.memory.workingSetSize,
      render: (memory: MemoryStats) => fileSize(memory.workingSetSize * 1024),
      width: '100px',
      fixed: 'right',
    },
    {
      title: (
        <div className={styles.columnTitle}>
          Peak
          <div className={styles.value}>
            {getTotalMemorySize(data, 'peakWorkingSetSize')}
          </div>
        </div>
      ),
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
      width: '60px',
      fixed: 'right',
      render: (type: string, item) => {
        const isDevtoolsSelf = !!item.webContentInfo?.url.startsWith('devtools://devtools');
        return (
          <>
            <StopOutlined title={`kill PID: ${item.pid}`} onClick={() => killProcess(item)} />
            {type === 'Tab' && !isDevtoolsSelf && (
              <BugOutlined
                title="debug"
                onClick={(e: any) => {
                  e.stopPropagation();
                  openDevTools(item.webContentInfo);
                }}
                style={{ marginLeft: 8 }}
              />
            )}
          </>
        );
      },
    },
  ];

  const updateAppMetrics = (_: any, appMetrics: any[]) => {
    const list = Array.isArray(appMetrics) ? appMetrics : [];
    if (list.length > MAX_COMMON_STRING_TEST && !isWindows()) {
      setProcessBaseIndex(findCommonStringPlus(list.map((item) => item.cmd)));
    }

    setData(list);
  };

  const onClickBlank = (e: any) => {
    if (e.target.nodeName === 'BODY') {
      setSelectedProcess(undefined);
    }
  };

  useEffect(() => {
    ipcRenderer.on(props.eventDataChannelName, updateAppMetrics);
    document.body.addEventListener('click', onClickBlank, false);
    return () => {
      ipcRenderer.removeListener(props.eventDataChannelName, updateAppMetrics);
      document.body.removeEventListener('click', onClickBlank);
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
          onClick: () => setSelectedProcess(record),
        })}
      />
      <BottomPanel
        processInfo={selectedProcess}
        ipcRenderer={props.ipcRenderer}
        eventActionChannelName={props.eventActionChannelName}
      />
      <Footer
        ipcRenderer={props.ipcRenderer}
        eventActionChannelName={EVENT_ACTION_CHANNEL_NAME}
      />
    </div>
  );
};

StatusBoard.defaultProps = {
  eventActionChannelName: EVENT_ACTION_CHANNEL_NAME,
  eventDataChannelName: EVENT_DATA_CHANNEL_NAME,
};

export default StatusBoard;
