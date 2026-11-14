import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

const { neonMock, sqlMock } = vi.hoisted(() => {
  const sqlMock = vi.fn();
  return { sqlMock, neonMock: vi.fn(() => sqlMock) };
});

vi.mock('@neondatabase/serverless', () => ({ neon: neonMock }));

import { DatabaseModule } from '../src/database/database.module';
import { DatabaseService } from '../src/database/database.service';

const config = (value?: string) =>
  ({ get: vi.fn(() => value) }) as unknown as ConfigService;

describe('DatabaseService', () => {
  it('creates a Neon client from DATABASE_URL', () => {
    new DatabaseService(config('postgresql://user:pass@host/grafic'));

    expect(neonMock).toHaveBeenCalledWith('postgresql://user:pass@host/grafic');
  });

  it('runs a query through the Neon client', async () => {
    const rows = [{ database: 'grafic' }];
    sqlMock.mockResolvedValueOnce(rows);
    const service = new DatabaseService(config('postgresql://user:pass@host/grafic'));

    await expect(service.getData()).resolves.toBe(rows);
    const [strings] = sqlMock.mock.calls[0]!;
    expect(strings.join('?')).toContain('current_database()');
  });

  it('throws when DATABASE_URL is missing', async () => {
    const service = new DatabaseService(config());

    await expect(service.getData()).rejects.toThrow('DATABASE_URL is not configured');
  });

  it('is exported by DatabaseModule', () => {
    expect(DatabaseModule).toBeDefined();
  });
});
