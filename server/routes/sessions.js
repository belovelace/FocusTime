const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// GET /api/sessions (browse)
router.get('/', auth, async (req, res) => {
  try {
    const { date, duration, mode, page = 1 } = req.query;
    const where = {};
    if (duration) where.durationMin = parseInt(duration,10);
    if (mode) where.focusMode = mode;
    if (date) {
      const day = new Date(date);
      const next = new Date(day);
      next.setUTCDate(next.getUTCDate()+1);
      where.startsAt = { gte: day.toISOString(), lt: next.toISOString() };
    }
    const take = 20; const skip = (page-1)*take;
    const items = await prisma.session.findMany({ where, skip, take, orderBy: { startsAt: 'asc' } });
    const total = await prisma.session.count({ where });
    res.json({ total, items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

// POST /api/sessions (create)
router.post('/', auth, async (req, res) => {
  try {
    let { startsAt, durationMin, focusMode } = req.body;
    if (!startsAt || !durationMin) return res.status(400).json({ error: 'missing fields' });
    // normalize focusMode aliases to enum values expected by Prisma
    const aliasMap = { deep: 'desk', study: 'any', work: 'moving', desk: 'desk', moving: 'moving', any: 'any' };
    if (typeof focusMode === 'string') focusMode = aliasMap[focusMode] || focusMode;
    const session = await prisma.session.create({ data: { hostId: req.userId, startsAt: new Date(startsAt), durationMin: Number(durationMin), focusMode } });
    res.status(201).json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'create failed' }); }
});

// GET /api/sessions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'not found' });
    res.json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'server error' }); }
});

// POST /api/sessions/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'not found' });
    // allow join only within 15 minutes before start or later
    const starts = new Date(session.startsAt).getTime();
    const allowedFrom = starts - (15 * 60 * 1000);
    const now = Date.now();
    if (now < allowedFrom) return res.status(400).json({ error: 'too_early', message: '예약 시간과 불일치 합니다.' });

    // atomic update: only set partnerId if currently null
    const updateResult = await prisma.session.updateMany({ where: { id, partnerId: null }, data: { partnerId: req.userId, status: 'matched' } });
    if (updateResult.count === 0) return res.status(409).json({ error: 'already matched or not available' });

    // create participant record
    await prisma.sessionParticipant.create({ data: { sessionId: id, userId: req.userId, role: 'partner' } });

    // create notifications for host
    if (session && session.hostId) {
      await prisma.notification.createMany({ data: [
        { userId: session.hostId, type: 'matched', payload: { sessionId: id, partnerId: req.userId } },
        { userId: req.userId, type: 'matched', payload: { sessionId: id, hostId: session.hostId } }
      ]});
    }

    const updated = await prisma.session.findUnique({ where: { id } });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'join failed' }); }
});

// POST /api/sessions/:id/messages
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'body required' });
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'session not found' });
    // allow only host/partner
    if (req.userId !== session.hostId && req.userId !== session.partnerId) return res.status(403).json({ error: 'not a participant' });
    const msg = await prisma.sessionMessage.create({ data: { sessionId: id, userId: req.userId, body } });
    res.status(201).json(msg);
  } catch (err) { console.error(err); res.status(500).json({ error: 'message failed' }); }
});

// GET /api/sessions/:id/messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const page = parseInt(req.query.page || '1',10);
    const take = 50; const skip = (page-1)*take;
    const items = await prisma.sessionMessage.findMany({ where: { sessionId: id }, orderBy: { sentAt: 'desc' }, skip, take });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'list failed' }); }
});

// POST /api/sessions/:id/goals
router.post('/:id/goals', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const { goalText, resultText, rating } = req.body;
    const g = await prisma.sessionGoal.create({ data: { sessionId: id, userId: req.userId, goalText, resultText, rating } });
    res.status(201).json(g);
  } catch (err) { console.error(err); res.status(500).json({ error: 'goal failed' }); }
});

// GET /api/sessions/:id/goals
router.get('/:id/goals', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const items = await prisma.sessionGoal.findMany({ where: { sessionId: id }, orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'list failed' }); }
});

// POST /api/sessions/:id/video
router.post('/:id/video', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: 'youtubeUrl required' });
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'session not found' });
    // create video entry
    const v = await prisma.sessionVideo.create({ data: { sessionId: id, userId: req.userId, youtubeUrl } });
    res.status(201).json(v);
  } catch (err) { console.error(err); res.status(500).json({ error: 'video failed' }); }
});

module.exports = router;