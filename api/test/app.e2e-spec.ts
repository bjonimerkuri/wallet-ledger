import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { DATABASE_URL, recreateSchema, resetDatabase } from './utils/test-db';

describe('Wallet API (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL;
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.NODE_ENV = 'test';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    ds = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    resetDatabase();
    await recreateSchema(ds);
  });

  const register = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'supersecret1' })
      .expect(201);
    return res.body.accessToken as string;
  };

  const balance = async (token: string) => {
    const res = await request(app.getHttpServer())
      .get('/accounts/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.email).toBeDefined();
    return res.body.balance as number;
  };

  const send = (token: string, key: string, toEmail: string, amount: number) =>
    request(app.getHttpServer())
      .post('/transfers')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ toEmail, amount });

  it('GET /health reports database up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('rejects unauthenticated access to the wallet', async () => {
    await request(app.getHttpServer()).get('/accounts/me').expect(401);
  });

  it('registers with demo funds and logs in', async () => {
    const token = await register('alice@example.com');
    expect(await balance(token)).toBe(10000);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'supersecret1' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('creates an atomic double-entry transfer', async () => {
    const alice = await register('alice@example.com');
    await register('bob@example.com');

    await send(alice, 'k1', 'bob@example.com', 1500).expect(201);

    expect(await balance(alice)).toBe(8500);
    const entries = await ds.query('SELECT amount FROM ledger_entry ORDER BY amount');
    expect(entries.map((e: any) => Number(e.amount))).toEqual([-1500, 1500]);
    const sum = await ds.query('SELECT SUM(amount)::bigint AS total FROM ledger_entry');
    expect(Number(sum[0].total)).toBe(0);
  });

  it('replays the same Idempotency-Key without moving money twice', async () => {
    const alice = await register('alice@example.com');
    await register('bob@example.com');

    const first = await send(alice, 'same-key', 'bob@example.com', 2000).expect(201);
    const second = await send(alice, 'same-key', 'bob@example.com', 2000).expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(await balance(alice)).toBe(8000);
    const count = await ds.query('SELECT COUNT(*)::int AS n FROM transfer');
    expect(count[0].n).toBe(1);
  });

  it('moves money exactly once under concurrent identical requests', async () => {
    const alice = await register('alice@example.com');
    await register('bob@example.com');

    const results = await Promise.all(
      Array.from({ length: 6 }, () => send(alice, 'race-key', 'bob@example.com', 2000)),
    );
    results.forEach((r) => expect(r.status).toBe(201));

    const ids = new Set(results.map((r) => r.body.id));
    expect(ids.size).toBe(1);
    expect(await balance(alice)).toBe(8000);
  });

  it('prevents overdrafts under concurrent distinct transfers', async () => {
    const alice = await register('alice@example.com');
    await register('bob@example.com');

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => send(alice, `bulk-${i}`, 'bob@example.com', 3000)),
    );
    const created = results.filter((r) => r.status === 201).length;
    expect(created).toBe(3);

    const balances = await ds.query('SELECT balance FROM account');
    const values = balances.map((b: any) => Number(b.balance));
    values.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    expect(values.reduce((a: number, b: number) => a + b, 0)).toBe(20000);
  });

  it('rejects invalid business inputs', async () => {
    const alice = await register('alice@example.com');
    await register('bob@example.com');

    await send(alice, 'neg', 'bob@example.com', -5).expect(400);
    await send(alice, 'float', 'bob@example.com', 1.5).expect(400);
    await send(alice, 'self', 'alice@example.com', 100).expect(400);
    await send(alice, 'ghost', 'nobody@example.com', 100).expect(404);
    await send(alice, 'over', 'bob@example.com', 999999).expect(422);
    await request(app.getHttpServer())
      .post('/transfers')
      .set('Authorization', `Bearer ${alice}`)
      .send({ toEmail: 'bob@example.com', amount: 100 })
      .expect(400);
  });

  it('validates DTO payloads strictly', async () => {
    const alice = await register('alice@example.com');
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
    await send(alice, 'bad-email', 'not-an-email', 100).expect(400);
    await request(app.getHttpServer())
      .get('/transfers?limit=abc')
      .set('Authorization', `Bearer ${alice}`)
      .expect(400);
  });

  it('returns paginated cursor history with directions', async () => {
    const alice = await register('alice@example.com');
    const bob = await register('bob@example.com');
    await register('carol@example.com');

    for (let i = 0; i < 5; i++) await send(alice, `p-${i}`, 'bob@example.com', 100).expect(201);
    await send(bob, 'to-alice', 'alice@example.com', 50).expect(201);

    const page1 = await request(app.getHttpServer())
      .get('/transfers?limit=2')
      .set('Authorization', `Bearer ${alice}`)
      .expect(200);
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.items[0].direction).toBe('received');
    expect(page1.body.nextCursor).toBeTruthy();

    const page2 = await request(app.getHttpServer())
      .get(`/transfers?limit=2&before=${encodeURIComponent(page1.body.nextCursor)}`)
      .set('Authorization', `Bearer ${alice}`)
      .expect(200);
    expect(page2.body.items).toHaveLength(2);

    const allIds = [...page1.body.items, ...page2.body.items].map((t: any) => t.id);
    expect(new Set(allIds).size).toBe(4);

    const last = await request(app.getHttpServer())
      .get(`/transfers?limit=50&before=${encodeURIComponent(page2.body.nextCursor ?? '')}`)
      .set('Authorization', `Bearer ${alice}`)
      .expect(200);
    expect(last.body.nextCursor).toBeNull();
  });
});
