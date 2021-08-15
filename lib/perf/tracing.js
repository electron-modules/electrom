'use strict';

const { contentTracing } = require('electron');

module.exports = async () => {
  // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/memory-infra/memory_infra_startup_tracing.md#the-advanced-way
  // https://docs.google.com/document/d/1b5BSBEd1oB-3zj_CBAQWiQZ0cmI0HmjmXG-5iNveLqw
  await contentTracing.startRecording({
    trace_buffer_size_in_kb: 1024 * 300,
    included_categories: [
      '*',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
      'disabled-by-default-v8.cpu_profiler',
      'disabled-by-default-v8.cpu_profiler.hires',
      'disabled-by-default-devtools.timeline.stack',
      'disabled-by-default-memory-infra',
      'partition_alloc',
    ],
    excluded_categories: [],
    memory_dump_config: {
      triggers: [
        {
          mode: 'light',
          periodic_interval_ms: 50,
        }, {
          mode: 'detailed',
          periodic_interval_ms: 1000,
        },
      ],
    },
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 6000);
  });

  const path = await contentTracing.stopRecording();
  console.log(path);
};
