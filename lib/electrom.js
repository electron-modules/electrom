'use strict';

const runScript = require('runscript');
const { ps: parsePs } = require('./parser');
const Monitor = require('./monitor');

class Electrom {
  async getAllProcess() {
    const res = await runScript('ps -A -o ppid,pid', { stdio: 'pipe' });
    return parsePs(res.stdout.toString());
  }
}

Electrom.Monitor = Monitor;

module.exports = Electrom;
