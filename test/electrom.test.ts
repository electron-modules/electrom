import { Monitor } from '../src/main';

describe('test', () => {
  it('should be ok', () => {
    const monitor = new Monitor();
    expect(monitor).toBeDefined();
  });
});
