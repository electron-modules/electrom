'use strict';

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const _ = require('lodash');
const filesize = require('filesize');

const TYPE_SORT_INDEX_MAP = {
  Browser: '0',
  Tab: '1',
  GPU: '2',
  Utility: '3',
  Nil: '4',
};

class TextReporter {}

const calcAll = array => {
  const avg = _.mean(array);
  const min = _.min(array);
  const max = _.max(array);
  return {
    avg,
    min,
    max,
  };
};

const formatCPUUsage = value => `${_.round(value * 10, 2)}%`;
const formatMemory = value => filesize(value * 1024);

const pickDataFromDir = (dir) => {
  const res = [];
  fs.readdirSync(dir)
    .filter(file => path.extname(file) === '.json')
    .forEach(file => {
      const filePath = path.join(dir, file);
      res.push({
        key: path.basename(file, path.extname(file)),
        data: require(filePath),
      });
      delete require.cache[filePath];
    });
  return res;
};

const genSummary = (originData) => {
  const processDataMap = {};
  const pickCount = originData.length;
  originData.forEach((data) => {
    const formatTime = moment(parseInt(data.key, 10)).format('YYYY-MM-DD HH:mm:ss.SSS');
    data.formatTime = formatTime;
    data.data.forEach(item => {
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

const genReporter = (originData) => {
  const data = genSummary(originData);
  const { pickCount, processDataArray } = data;
  const list = [];
  processDataArray.forEach(item => {
    list.push(`pid: ${item.pid}(${item.type})`);
    const mem = calcAll(item.memoryWorkingSetSize);
    list.push(`mem: ${formatMemory(mem.avg)}(avg) ${formatMemory(mem.max)}(max) ${formatMemory(mem.min)}(min)`);
    const cpu = calcAll(item.percentCPUUsage);
    list.push(`cpu: ${formatCPUUsage(cpu.avg)}(avg) ${formatCPUUsage(cpu.max)}(max) ${formatCPUUsage(cpu.min)}(min)`);
  });
  const str = [
    `pick: ${pickCount}`,
    `${list.join('\n')}`,
  ].join('\n');
  return {
    str,
    str_list: list,
    data,
  };
};

TextReporter.genReporter = genReporter;

TextReporter.pickDataFromDir = pickDataFromDir;

module.exports = TextReporter;
