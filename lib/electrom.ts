'use strict';

import runScript from 'runscript';
import { ps as parsePs } from './parser';

export { PerfTracing } from './perf/tracing';
export { Monitor } from './monitor';

export class Electrom {
  async getAllProcess() {
    const res = await runScript('ps -A -o ppid,pid', { stdio: 'pipe' });
    return parsePs(res.stdout?.toString());
  }
}
