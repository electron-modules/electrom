import { join } from 'path';
import moment from 'moment';
import { contentTracing } from 'electron';

const debug = require('debug')('perf-tracing');

const BUFFER_SIZE = 1024 * 300;
const PARTITION_THRESHOLD = 10e3;

// https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/memory-infra/memory_infra_startup_tracing.md#the-advanced-way
// https://docs.google.com/document/d/1b5BSBEd1oB-3zj_CBAQWiQZ0cmI0HmjmXG-5iNveLqw
const included_categories = [
  '*',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-v8.cpu_profiler',
  'disabled-by-default-v8.cpu_profiler.hires',
  'disabled-by-default-devtools.timeline.stack',
  'disabled-by-default-memory-infra',
  'partition_alloc',
];

const memoryDumpDefaultConfig = {
  triggers: [
    {
      mode: 'light',
      periodic_interval_ms: 50,
    },
    {
      mode: 'detailed',
      periodic_interval_ms: 1e3,
    },
  ],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const dump = async ({ memoryDumpConfig: memory_dump_config, partitionThreshold, dumpTargetDir }: any) => {
  const dumpTargetDirFile = join(dumpTargetDir, `${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}.json`);
  debug('recoding: %s', dumpTargetDirFile);
  await contentTracing.startRecording({
    trace_buffer_size_in_kb: BUFFER_SIZE,
    included_categories,
    excluded_categories: [],
    memory_dump_config,
  });
  await sleep(partitionThreshold);
  debug('dumping: %s', dumpTargetDirFile);
  return await contentTracing.stopRecording(dumpTargetDirFile);
};

interface PerfTracingOptions {
  partitionThreshold?: number;
  memoryDumpConfig?: any;
  dumpTargetDir?: string;
}

/**
 * @param {Object} options.memoryDumpConfig
 * @param {Object} options.dumpTargetDir
 */
export const PerfTracing = (options: PerfTracingOptions = {}) => {
  const partitionThreshold = options.partitionThreshold || PARTITION_THRESHOLD;
  const memoryDumpConfig = Object.assign(memoryDumpDefaultConfig, options.memoryDumpConfig || {});
  const dumpTargetDir = options.dumpTargetDir || process.cwd();
  dump({
    dumpTargetDir,
    partitionThreshold,
    memoryDumpConfig,
  })
    .then()
    .catch(debug)
    .finally(() => PerfTracing(options));
};
