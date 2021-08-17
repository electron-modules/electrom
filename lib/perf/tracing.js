'use strict';

const path = require('path');
const { contentTracing } = require('electron');

const debug = require('debug')('perf-tracing');

const BUFFER_SIZE = 1024 * 300;
const PARTITION_THRESHOLD = 10E3;

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
    }, {
      mode: 'detailed',
      periodic_interval_ms: 1E3,
    },
  ],
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const dump = async ({
  memoryDumpConfig: memory_dump_config,
  partitionThreshold,
  dumpTargetDir,
}) => {
  const dumpTargetDirFile = path.join(dumpTargetDir, `${Date.now()}.json`);
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

/**
 * @param {Object} options.memoryDumpConfig
 * @param {Object} options.dumpTargetDir
 */
const run = (options = {}) => {
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
    .finally(() => run(options));
};

module.exports = run;
