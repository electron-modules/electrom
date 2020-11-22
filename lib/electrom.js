'use strict';

const runScript = require('runscript');
const { ps: parsePs } = require('./parser');

module.exports = async (pid) => {
  runScript('ps -A -o ppid,pid', { stdio: 'pipe' })
    .then(stdio => {
      const res = stdio.stdout.toString();
      console.log(parsePs(res));
    })
    .catch(err => {
      console.error(err);
    });
};
