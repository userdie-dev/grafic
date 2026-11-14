import { afterEach, expect, it, vi } from 'vitest';
import pg from 'pg';
import { DataSource } from 'typeorm';
import { PlatformTools } from 'typeorm/platform/PlatformTools.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
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
    driver: pg,
    url: 'postgresql://user:pass@host:5432/grafic',
    ssl: { rejectUnauthorized: false },
  });
});

it('constructs the PostgreSQL driver even when dynamic package loading is unavailable', async () => {
  process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/grafic';
  const typeorm = await import('@nestjs/typeorm');
  const configSpy = vi.spyOn(typeorm.TypeOrmModule, 'forRoot');
  await import('../src/app.module');
  const loadSpy = vi.spyOn(PlatformTools, 'load').mockImplementation((name) => {
    throw new Error(`Dynamic package loading unavailable: ${name}`);
  });

  const dataSource = new DataSource(configSpy.mock.calls[0]![0] as ConstructorParameters<typeof DataSource>[0]);

  expect(dataSource.driver).toMatchObject({ postgres: pg });
  expect(loadSpy).not.toHaveBeenCalledWith('pg');
});
