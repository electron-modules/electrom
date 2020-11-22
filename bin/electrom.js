#!/usr/bin/env node

'use strict';

const { EOL } = require('os');
const program = require('commander');

const pkg = require('../package');

program
  .option('-v, --versions', 'show version and exit');

program.parse(process.argv);

if (program.versions) {
  console.info('%s  %s%s', EOL, pkg.version, EOL);
  process.exit(0);
}

const arg_0 = program.args[0];

const electrom = require('..');

if (arg_0) {
  electrom(arg_0)
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.log(error);
    });
}