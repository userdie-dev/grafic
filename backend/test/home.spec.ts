import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from './helpers';

describe('Backend home page', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves an HTML page at / without a device token', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html; charset=utf-8/);

    expect(response.text).toContain('<html lang="ru">');
    expect(response.text).toContain('<h1>График смен</h1>');
    expect(response.text).toContain('Authorization: Bearer');
  });
});
