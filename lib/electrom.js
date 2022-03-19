'use strict';

const runScript = require('runscript');
const { ps: parsePs } = require('./parser');
const Monitor = require('./monitor');
const PerfTracing = require('./perf/tracing');

class Electrom {
  async getAllProcess () {
    const res = await runScript('ps -A -o ppid,pid', { stdio: 'pipe' }).then(console.log);
    console.log('res:', res);
    return parsePs(res.stdout.toString());
  }
}

Electrom.Monitor = Monitor;
Electrom.PerfTracing = PerfTracing;

module.exports = Electrom;
