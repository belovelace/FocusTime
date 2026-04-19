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

test('create and join session + messages/goals/video', async () => {
  // create session
  const res1 = await request(app).post('/api/sessions').set('Authorization', `Bearer ${token}`).send({ startsAt: new Date().toISOString(), durationMin: 25 });
  expect(res1.statusCode).toBe(201);
  sessionId = res1.body.id;

  // join session
  const res2 = await request(app).post(`/api/sessions/${sessionId}/join`).set('Authorization', `Bearer ${token}`).send({});
  expect([200,409]).toContain(res2.statusCode);

  // fetch session to verify
  const sres = await request(app).get(`/api/sessions/${sessionId}`).set('Authorization', `Bearer ${token}`);
  expect(sres.statusCode).toBe(200);
  const session = sres.body;
  expect(session).toHaveProperty('id');

  // POST a message
  const messageText = 'hello from integration test';
  const msgRes = await request(app).post(`/api/sessions/${sessionId}/messages`).set('Authorization', `Bearer ${token}`).send({ body: messageText });
  expect(msgRes.statusCode).toBe(201);
  expect(msgRes.body).toHaveProperty('body', messageText);
  expect(msgRes.body).toHaveProperty('sessionId', sessionId);

  // GET messages
  const getMsgs = await request(app).get(`/api/sessions/${sessionId}/messages`).set('Authorization', `Bearer ${token}`);
  expect(getMsgs.statusCode).toBe(200);
  expect(Array.isArray(getMsgs.body)).toBe(true);
  expect(getMsgs.body.some(m => m.body === messageText)).toBe(true);

  // POST a goal
  const goalText = 'Complete README and tests';
  const goalRes = await request(app).post(`/api/sessions/${sessionId}/goals`).set('Authorization', `Bearer ${token}`).send({ goalText });
  expect(goalRes.statusCode).toBe(201);
  expect(goalRes.body).toHaveProperty('goalText', goalText);

  // GET goals
  const getGoals = await request(app).get(`/api/sessions/${sessionId}/goals`).set('Authorization', `Bearer ${token}`);
  expect(getGoals.statusCode).toBe(200);
  expect(Array.isArray(getGoals.body)).toBe(true);
  expect(getGoals.body.some(g => g.goalText === goalText)).toBe(true);

  // POST a video URL
  const videoUrl = 'https://youtu.be/2eB_iK3OGao';
  const vidRes = await request(app).post(`/api/sessions/${sessionId}/video`).set('Authorization', `Bearer ${token}`).send({ youtubeUrl: videoUrl });
  expect(vidRes.statusCode).toBe(201);
  expect(vidRes.body).toHaveProperty('youtubeUrl', videoUrl);
});
