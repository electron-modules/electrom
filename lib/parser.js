'use strict';

const { EOL } = require('os');

/**
 *  PPID   PID
    0     1
    1    59
    1    60
 * @param {string} str 
 */
exports.ps = (stdout) => {
  stdout = stdout.split(EOL);
  const list = [];

  for (let i = 1; i < stdout.length; i++) {
    stdout[i] = stdout[i].trim();
    if (!stdout[i]) {
      continue;
    }
    stdout[i] = stdout[i].split(/\s+/);
    stdout[i][0] = parseInt(stdout[i][0], 10);
    stdout[i][1] = parseInt(stdout[i][1], 10);
    list.push(stdout[i]);
  }
  return list;
};
