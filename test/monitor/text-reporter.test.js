'use strict';

const path = require('path');
const assert = require('assert');

const Electrom = require('../..');

describe('test/monitor/text-reporter.test.js', () => {
  let res;

  describe('pickDataFromDir()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      res = Electrom.Monitor.Reporter.pickDataFromDir(dir);
      assert.equal(res.length, 21);
    });
  });

  describe('genTextReporter()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      const data = Electrom.Monitor.Reporter.pickDataFromDir(dir);
      res = Electrom.Monitor.Reporter.genTextReporter(data);
      assert(res.str);
    });
  });

  describe('genHtmlReporter()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      const data = Electrom.Monitor.Reporter.pickDataFromDir(dir);
      res = Electrom.Monitor.Reporter.renderHtmlReporter(data);
      assert(res);
    });
  });
});
