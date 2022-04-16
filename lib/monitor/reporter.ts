import fs from 'fs';
import path from 'path';
import moment from 'moment';
import _ from 'lodash';
import filesize from 'filesize';

const templatePath = path.join(__dirname, 'reporter.template.html');
const template = fs.readFileSync(templatePath, 'utf8');

const TYPE_SORT_INDEX_MAP = {
  Browser: '0',
  Tab: '1',
  GPU: '2',
  Utility: '3',
  Nil: '4',
};

const calcAll = (array: number[]) => {
  const avg = _.mean(array);
  const min = _.min(array);
  const max = _.max(array);
  return {
    avg,
    min,
    max,
  };
};

const formatCPUUsage = (value: number) => `${_.round(value * 10, 2)}%`;
const formatMemory = (value: number) => filesize(value * 1024);

export const pickDataFromDir = (dir: string) => {
  const res: { key: string; data: any }[] = [];
  fs.readdirSync(dir)
    .filter((file) => path.extname(file) === '.json')
    .forEach((file) => {
      const filePath = path.join(dir, file);
      res.push({
        key: path.basename(file, path.extname(file)),
        data: require(filePath),
      });
      delete require.cache[filePath];
    });
  return res;
};

interface SummaryItem {
  pid: number;
  type: keyof typeof TYPE_SORT_INDEX_MAP;
  creationTime: number;
  memory: any;
  cpu: any;
}

const genSummary = (originData: any[]) => {
  const processDataMap: any = {};
  const pickCount = originData.length;
  originData.forEach((data) => {
    const formatTime = moment(parseInt(data.key, 10)).format('YYYY-MM-DD HH:mm:ss.SSS');
    data.formatTime = formatTime;
    data.data.forEach((item: SummaryItem) => {
      const { pid, type, creationTime, memory, cpu } = item;
      const { percentCPUUsage } = cpu;
      const { workingSetSize, peakWorkingSetSize } = memory;
      processDataMap[pid] = processDataMap[pid] || {
        pid,
        creationTime,
        percentCPUUsage: [],
        memoryWorkingSetSize: [],
        memoryPeakWorkingSetSize: [],
        type: `${TYPE_SORT_INDEX_MAP[type] || TYPE_SORT_INDEX_MAP.Nil}_${type}`,
      };
      processDataMap[pid].percentCPUUsage.push(percentCPUUsage);
      processDataMap[pid].memoryWorkingSetSize.push(workingSetSize);
      processDataMap[pid].memoryPeakWorkingSetSize.push(peakWorkingSetSize);
    });
  });
  const processDataArray = _.sortBy(_.toArray(processDataMap), 'type');
  return {
    pickCount,
    processDataMap,
    processDataArray,
    originData,
  };
};

export const genTextReporter = (originData: any[]) => {
  const data = genSummary(originData);
  const { pickCount, processDataArray } = data;
  const list: string[] = [];
  processDataArray.forEach((item: any) => {
    list.push(`pid: ${item.pid}(${item.type})`);
    const mem: { max?: number; min?: number; avg?: number } = calcAll(item.memoryWorkingSetSize);
    list.push(`mem: ${formatMemory(mem.avg || 0)}(avg) ${formatMemory(mem.max || 0)}(max) ${formatMemory(mem.min || 0)}(min)`);
    const cpu: { max?: number; min?: number; avg?: number } = calcAll(item.percentCPUUsage);
    list.push(`cpu: ${formatCPUUsage(cpu.avg || 0)}(avg) ${formatCPUUsage(cpu.max || 0)}(max) ${formatCPUUsage(cpu.min || 0)}(min)`);
  });
  const str = [`pick: ${pickCount}`, `${list.join('\n')}`].join('\n');
  return {
    pickCount,
    str,
    str_list: list,
    data,
  };
};

export const renderHtmlReporter = (originData: any[]) => {
  const data = genSummary(originData);
  return template.replace(/\/\/\s+insert-global-data/g, `window.data = ${JSON.stringify(data)};`);
};

export default { genTextReporter, renderHtmlReporter, pickDataFromDir };
