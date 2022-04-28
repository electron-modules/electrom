import { Monitor } from '../src/main/electrom';

describe('test', () => {
  it('should be ok', () => {
    const monitor = new Monitor();
    expect(monitor).toBeDefined();
  });
});
