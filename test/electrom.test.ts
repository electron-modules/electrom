import { Monitor } from '../lib/electrom';

describe('test', () => {
  it('should be ok', () => {
    const monitor = new Monitor();
    expect(monitor).toBeDefined();
  });
});
