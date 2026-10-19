import { vi } from 'vitest';
import { DevicesService, hashToken } from '../src/devices/devices.service';

describe('DevicesService.uniqueCode', () => {
  it('retries until it finds an unused code', async () => {
    const exists = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const repo: any = {
      exists,
      create: (x: unknown) => x,
      save: async (x: any) => ({ id: 'id', ...x }),
    };
    const svc = new DevicesService(repo);
    const res = await svc.register();
    expect(exists).toHaveBeenCalledTimes(2);
    expect(res.shareCode).toHaveLength(6);
  });

  it('hashes tokens deterministically', () => {
    expect(hashToken('a')).toBe(hashToken('a'));
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});

describe('SubscriptionsService.subscribe', () => {
  it('trims the code', async () => {
    const { SubscriptionsService } = await import('../src/subscriptions/subscriptions.service');
    const findUser = vi.fn().mockResolvedValue({ id: 'owner' });
    const svc = new SubscriptionsService(
      { findOne: vi.fn().mockResolvedValue({ id: 's' }) } as any,
      { findOne: findUser } as any,
      {} as any,
    );
    await svc.subscribe({ id: 'me' } as any, '  ab12cd ');
    expect(findUser).toHaveBeenCalledWith({ where: { shareCode: 'AB12CD' } });
  });
});
