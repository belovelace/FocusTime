require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const request = require('supertest');
let app;
let prisma;

let token;
let testUserId;
let sessionId;

beforeAll(async () => {
  // use real DB for integration tests: override jest NODE_ENV so prisma mock isn't used
  process.env.NODE_ENV = 'development';
  // prefer explicit test DB URL if provided, otherwise fall back to env or default
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL || 'mysql://root:1234@localhost:3306/focustime_test';

  // require app/prisma after env is set so real PrismaClient is used
  app = require('../server/index');
  prisma = require('../server/lib/prisma');

  // create test user
  const user = await prisma.user.create({ data: { email: 'test@example.com', passwordHash: 'x', nickname: 'test' } });
  testUserId = user.id;
  // generate token (using same secret as server)
  const jwt = require('jsonwebtoken');
  token = jwt.sign({ userId: user.id, role: 'user' }, process.env.JWT_SECRET || 'dev', { expiresIn: '1h' });
});

afterAll(async () => {
  // cleanup
  await prisma.sessionParticipant.deleteMany({ where: { userId: testUserId } });
  await prisma.session.deleteMany({ where: { hostId: testUserId } });
  await prisma.user.deleteMany({ where: { id: testUserId } });
  await prisma.$disconnect();
});

test('create and join session', async () => {
  // create session
  const res1 = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ startsAt: new Date().toISOString(), durationMin: 25 });
  expect(res1.statusCode).toBe(201);
  sessionId = res1.body.id;

  // join session
  const res2 = await request(app).post(`/api/sessions/${sessionId}/join`).set('Authorization', `Bearer ${token}`).send({});
  expect([200,409]).toContain(res2.statusCode);
});
