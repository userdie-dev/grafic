import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  process.env.DB_PATH = ':memory:';
  delete process.env.DATABASE_URL;
  vi.resetModules();
});

it('falls back to grafic.sqlite when DB_PATH is unset', async () => {
  delete process.env.DB_PATH;
  const typeorm = await import('@nestjs/typeorm');
  const spy = vi.spyOn(typeorm.TypeOrmModule, 'forRoot');
  await import('../src/app.module');
  expect(spy.mock.calls[0]![0]).toMatchObject({ database: 'grafic.sqlite' });
});

it('uses PostgreSQL when DATABASE_URL is set', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/grafic';
  const typeorm = await import('@nestjs/typeorm');
  const spy = vi.spyOn(typeorm.TypeOrmModule, 'forRoot');
  await import('../src/app.module');
  expect(spy.mock.calls[0]![0]).toMatchObject({
    type: 'postgres',
    url: 'postgresql://user:pass@host:5432/grafic',
    ssl: { rejectUnauthorized: false },
  });
});
