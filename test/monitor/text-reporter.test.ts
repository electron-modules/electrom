import path from 'path';
import assert from 'assert';

import Reporter from '../../lib/monitor/reporter';

describe('test/monitor/text-reporter.test.js', () => {
  let res;

  describe('pickDataFromDir()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      res = Reporter.pickDataFromDir(dir);
      assert.equal(res.length, 21);
    });
  });

  describe('genTextReporter()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      const data = Reporter.pickDataFromDir(dir);
      res = Reporter.genTextReporter(data);
      assert(res.str);
    });
  });

  describe('genHtmlReporter()', () => {
    it('should be ok', () => {
      const dir = path.join(__dirname, '..', 'fixture', 'metrics');
      const data = Reporter.pickDataFromDir(dir);
      res = Reporter.renderHtmlReporter(data);
      assert(res);
    });
  });
});
