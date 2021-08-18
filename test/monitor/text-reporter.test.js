'use strict';

const path = require('path');
const assert = require('assert');

const Electrom = require('../..');

describe('test/monitor/text-reporter.test.js', () => {
  let res;

  describe('pickDataFromDir()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      res = Electrom.Monitor.TextReporter.pickDataFromDir(dir);
      assert.equal(res.length, 2);
    });
  });

  describe('genReporter()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      const data = Electrom.Monitor.TextReporter.pickDataFromDir(dir);
      res = Electrom.Monitor.TextReporter.genReporter(data);
      assert(res.str);
    });
  });
});
