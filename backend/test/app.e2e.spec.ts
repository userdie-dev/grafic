import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DevicesService } from '../src/devices/devices.service';
import { createApp } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('API', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  // POST /devices is throttled to 5/min, so most tests register through the service
  const register = () => app.get(DevicesService).register();

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(() => app.close());

  describe('devices & auth', () => {
    it('registers a device and issues a share code', async () => {
      const d = (await http().post('/devices').expect(201)).body;
      expect(d.token).toBeTruthy();
      expect(d.shareCode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    });

    it('rejects missing, malformed and unknown tokens', async () => {
      await http().get('/me/shifts').expect(401);
      await http().get('/me/shifts').set('Authorization', 'Basic abc').expect(401);
      await http().get('/me/shifts').set('Authorization', 'Bearer ').expect(401);
      await http().get('/me/shifts').set(auth('nope')).expect(401);
      await http().get('/me/shifts?token=nope').expect(401);
      await http().get('/me/shifts?token[]=a').expect(401);
    });

    it('accepts the token via ?token=', async () => {
      const d = await register();
      await http().get(`/me/shifts?token=${d.token}`).expect(200);
    });

    it('regenerates the share code', async () => {
      const d = await register();
      const res = await http().post('/me/share-code/regenerate').set(auth(d.token)).expect(201);
      expect(res.body.shareCode).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
      expect(res.body.shareCode).not.toBe(d.shareCode);
    });
  });

  describe('shifts', () => {
    it('upserts, lists, filters, updates and deletes', async () => {
      const d = await register();
      const put = (shifts: unknown[]) => http().put('/me/shifts').set(auth(d.token)).send({ shifts });

      const created = await put([
        { date: '2030-01-10', start: '09:00', end: '18:00', note: 'a' },
        { date: '2030-02-10', start: '09:00', end: '18:00' },
      ]).expect(200);
      expect(created.body).toHaveLength(2);
      expect(created.body[1].note).toBeNull();

      // same date+start updates in place
      const updated = await put([{ date: '2030-01-10', start: '09:00', end: '19:00' }]).expect(200);
      expect(updated.body[0].id).toBe(created.body[0].id);

      const all = await http().get('/me/shifts').set(auth(d.token)).expect(200);
      expect(all.body.map((s: { date: string }) => s.date)).toEqual(['2030-01-10', '2030-02-10']);
      expect(all.body[0].end).toBe('19:00');

      const ranged = await http().get('/me/shifts?from=2030-01-01&to=2030-01-31').set(auth(d.token)).expect(200);
      expect(ranged.body).toHaveLength(1);

      // only one bound -> no range filter
      const half = await http().get('/me/shifts?from=2030-01-01').set(auth(d.token)).expect(200);
      expect(half.body).toHaveLength(2);

      await http().delete(`/me/shifts/${created.body[0].id}`).set(auth(d.token)).expect(200, { deleted: true });
      await http().delete(`/me/shifts/${created.body[0].id}`).set(auth(d.token)).expect(200, { deleted: false });
    });

    it('validates input', async () => {
      const d = await register();
      const put = (body: unknown) => http().put('/me/shifts').set(auth(d.token)).send(body);
      await put({}).expect(400);
      await put({ shifts: [{ date: 'x', start: '09:00', end: '18:00' }] }).expect(400);
      await put({ shifts: [{ date: '2030-01-01', start: '25:00', end: '18:00' }] }).expect(400);
      // matches the regexp but is not a real date
      await put({ shifts: [{ date: '2030-13-45', start: '09:00', end: '18:00' }] }).expect(400);
      await put({ shifts: [{ date: '2030-01-01', start: '09:00', end: '18:00', note: 'x'.repeat(201) }] }).expect(400);
      await http().get('/me/shifts?from=bad&to=2030-01-01').set(auth(d.token)).expect(400);
      await http().get('/me/shifts?from=2030-01-01&to=bad').set(auth(d.token)).expect(400);
    });

    it('does not let users touch each other shifts', async () => {
      const a = await register();
      const b = await register();
      const [shift] = (
        await http().put('/me/shifts').set(auth(a.token)).send({ shifts: [{ date: '2030-03-01', start: '09:00', end: '10:00' }] })
      ).body;
      await http().delete(`/me/shifts/${shift.id}`).set(auth(b.token)).expect(200, { deleted: false });
      const mine = await http().get('/me/shifts').set(auth(a.token)).expect(200);
      expect(mine.body).toHaveLength(1);
    });
  });

  describe('subscriptions', () => {
    it('subscribes by code, is idempotent, lists, shows friend shifts and unsubscribes', async () => {
      const owner = await register();
      const sub = await register();
      await http()
        .put('/me/shifts')
        .set(auth(owner.token))
        .send({ shifts: [{ date: '2030-04-01', start: '08:00', end: '16:00' }] })
        .expect(200);

      // code is case-insensitive (trim is covered at service level: DTO length caps the raw input)
      const created = await http()
        .post('/subscriptions')
        .set(auth(sub.token))
        .send({ code: owner.shareCode.toLowerCase() })
        .expect(201);
      expect(created.body.ownerId).toBe(owner.userId);

      const again = await http().post('/subscriptions').set(auth(sub.token)).send({ code: owner.shareCode }).expect(201);
      expect(again.body.id).toBe(created.body.id);

      const list = await http().get('/subscriptions').set(auth(sub.token)).expect(200);
      expect(list.body).toHaveLength(1);

      const shifts = await http()
        .get(`/friends/${owner.userId}/shifts?from=2030-04-01&to=2030-04-30`)
        .set(auth(sub.token))
        .expect(200);
      expect(shifts.body).toHaveLength(1);

      await http().delete(`/subscriptions/${created.body.id}`).set(auth(sub.token)).expect(200, { deleted: true });
      await http().delete(`/subscriptions/${created.body.id}`).set(auth(sub.token)).expect(200, { deleted: false });
      await http().get(`/friends/${owner.userId}/shifts`).set(auth(sub.token)).expect(403);
    });

    it('rejects unknown codes, self-subscription and bad bodies', async () => {
      const u = await register();
      await http().post('/subscriptions').set(auth(u.token)).send({ code: 'ZZZZZZ' }).expect(404);
      await http().post('/subscriptions').set(auth(u.token)).send({ code: u.shareCode }).expect(400);
      await http().post('/subscriptions').set(auth(u.token)).send({ code: 'ab' }).expect(400);
    });
  });

  describe('throttling', () => {
    it('limits device registration', async () => {
      const limited = await createApp();
      try {
        const codes: number[] = [];
        for (let i = 0; i < 6; i++) codes.push((await request(limited.getHttpServer()).post('/devices')).status);
        expect(codes.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
        expect(codes[5]).toBe(429);
      } finally {
        await limited.close();
      }
    });
  });
});
