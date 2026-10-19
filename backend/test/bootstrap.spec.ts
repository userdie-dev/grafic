import { afterEach, describe, expect, it, vi } from 'vitest';

describe('main bootstrap', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@nestjs/core');
    vi.doUnmock('../src/app.module');
    delete process.env.PORT;
  });

  const run = async (port?: string) => {
    const app = { enableCors: vi.fn(), useGlobalPipes: vi.fn(), listen: vi.fn().mockResolvedValue(undefined) };
    vi.doMock('@nestjs/core', async (orig) => ({
      ...(await orig<object>()),
      NestFactory: { create: vi.fn().mockResolvedValue(app) },
    }));
    vi.doMock('../src/app.module', () => ({ AppModule: class {} }));
    if (port) process.env.PORT = port;
    await import('../src/main');
    await new Promise((r) => setImmediate(r));
    return app;
  };

  it('listens on 3000 by default', async () => {
    const app = await run();
    expect(app.enableCors).toHaveBeenCalled();
    expect(app.useGlobalPipes).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalledWith(3000);
  });

  it('listens on PORT when set', async () => {
    const app = await run('4567');
    expect(app.listen).toHaveBeenCalledWith('4567');
  });
});
