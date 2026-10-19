import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  process.env.DB_PATH = ':memory:';
  vi.resetModules();
});

it('falls back to grafic.sqlite when DB_PATH is unset', async () => {
  delete process.env.DB_PATH;
  const typeorm = await import('@nestjs/typeorm');
  const spy = vi.spyOn(typeorm.TypeOrmModule, 'forRoot');
  await import('../src/app.module');
  expect(spy.mock.calls[0]![0]).toMatchObject({ database: 'grafic.sqlite' });
});
