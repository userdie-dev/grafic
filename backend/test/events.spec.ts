import { vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import request from 'supertest';
import { EventsController } from '../src/events/events.controller';
import { EventsService } from '../src/events/events.service';
import { User } from '../src/entities/user.entity';
import { DevicesService } from '../src/devices/devices.service';
import { createApp } from './helpers';

describe('EventsService', () => {
  afterEach(() => vi.useRealTimers());

  it('delivers emitted events to every open stream of the user only', () => {
    const svc = new EventsService();
    const a1: unknown[] = [];
    const a2: unknown[] = [];
    const b: unknown[] = [];
    const subs = [
      svc.stream('a').subscribe((m) => a1.push(m)),
      svc.stream('a').subscribe((m) => a2.push(m)),
      svc.stream('b').subscribe((m) => b.push(m)),
    ];
    const ev = { type: 'schedule.changed' as const, ownerId: 'o', dates: ['2030-01-01'] };
    svc.emit('a', ev);
    expect(a1).toEqual([{ type: 'schedule.changed', data: ev }]);
    expect(a2).toHaveLength(1);
    expect(b).toHaveLength(0);
    svc.emit('nobody', ev); // no open streams: no-op
    subs.forEach((s) => s.unsubscribe());
  });

  it('cleans up on unsubscribe, keeping other connections of the same user', () => {
    const svc = new EventsService();
    const got: unknown[] = [];
    const s1 = svc.stream('a').subscribe();
    const s2 = svc.stream('a').subscribe((m) => got.push(m));
    const ev = { type: 'schedule.changed' as const, ownerId: 'o', dates: [] };

    s1.unsubscribe();
    svc.emit('a', ev);
    expect(got).toHaveLength(1);

    s2.unsubscribe();
    expect((svc as any).streams.has('a')).toBe(false);
  });

  it('sends a heartbeat every 25s', async () => {
    vi.useFakeTimers();
    const svc = new EventsService();
    const p = firstValueFrom(svc.stream('a').pipe(take(2), toArray()));
    vi.advanceTimersByTime(50_000);
    expect(await p).toEqual([
      { type: 'ping', data: {} },
      { type: 'ping', data: {} },
    ]);
  });
});

describe('EventsController', () => {
  it('maps the user stream to SSE messages', async () => {
    const svc = new EventsService();
    const ctrl = new EventsController(svc);
    const p = firstValueFrom(ctrl.stream({ id: 'u1' } as User));
    svc.emit('u1', { type: 'schedule.changed', ownerId: 'o', dates: [] });
    expect(await p).toEqual({ type: 'schedule.changed', data: { type: 'schedule.changed', ownerId: 'o', dates: [] } });
  });
});

describe('GET /events (SSE)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
    await app.listen(0);
  });
  afterAll(() => app.close());

  it('requires auth and pushes schedule.changed to subscribers', async () => {
    const url = await app.getUrl();
    const reg = () => app.get(DevicesService).register();
    const owner = await reg();
    const sub = await reg();

    expect((await fetch(`${url}/events`)).status).toBe(401);

    await request(url).post('/subscriptions').set('Authorization', `Bearer ${sub.token}`).send({ code: owner.shareCode }).expect(201);

    const ac = new AbortController();
    const res = await fetch(`${url}/events?token=${sub.token}`, { signal: ac.signal });
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    await request(url)
      .put('/me/shifts')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ shifts: [{ date: '2030-05-01', start: '09:00', end: '10:00' }] })
      .expect(200);

    const reader = res.body!.getReader();
    let text = '';
    while (!text.includes('2030-05-01')) {
      const { value, done } = await reader.read();
      if (done) break;
      text += Buffer.from(value).toString();
    }
    expect(text).toContain('event: schedule.changed');
    expect(text).toContain(owner.userId);

    ac.abort();
  });
});
