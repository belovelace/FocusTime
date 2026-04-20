const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// GET /api/sessions (browse)
router.get('/', auth, async (req, res) => {
  try {
    const { date, duration, mode, page = 1, host, past } = req.query;
    const where = {};

    // allow host=me to filter sessions where the authenticated user is the host
    if (host === 'me') {
      where.hostId = req.userId;
    } else if (host) {
      const hid = parseInt(host, 10);
      if (!isNaN(hid)) where.hostId = hid;
    }

    if (duration) where.durationMin = parseInt(duration,10);
    if (mode) where.focusMode = mode;

    // date-based filtering (client sends YYYY-MM-DD)
    if (date) {
      // Interpret the date string as a local day from client perspective by building range using Date(year,month-1,day)
      const [y, m, d] = date.split('-').map(v => parseInt(v,10));
      const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
      const dayEnd = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
      where.startsAt = { gte: dayStart.toISOString(), lt: dayEnd.toISOString() };
    }

    // support past=1 to fetch sessions that started before now
    let orderBy = { startsAt: 'asc' };
    if (past === '1') {
      where.startsAt = where.startsAt || {};
      where.startsAt.lt = new Date().toISOString();
      orderBy = { startsAt: 'desc' };
    }

    const take = 20; const skip = (page-1)*take;
    const items = await prisma.session.findMany({ where, skip, take, orderBy });
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
    // if caller provided a goalText, create a sessionGoal for the host
    if (req.body && req.body.goalText) {
      try { await prisma.sessionGoal.create({ data: { sessionId: session.id, userId: req.userId, goalText: String(req.body.goalText).slice(0,100) } }); } catch(e){ console.error('goal create failed', e); }
    }
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
    const durationMs = (Number(session.durationMin || 25) * 60 * 1000);
    const allowedFrom = starts - durationMs; // allow joining as early as one full session length before start
    const ends = starts + durationMs;
    const now = Date.now();
    if (now < allowedFrom || now > ends) return res.status(400).json({ error: 'too_early_or_finished', message: '참가 가능한 시간이 아닙니다.' });

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

// DELETE /api/sessions/:id -> cancel a scheduled session (host only, must be before startsAt)
router.delete('/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'not found' });
    if (String(session.hostId) !== String(req.userId)) return res.status(403).json({ error: 'forbidden' });
    const starts = new Date(session.startsAt).getTime();
    // Disallow cancellation within 10 minutes of start
    const cancelDeadline = starts - (15 * 60 * 1000);
    if (Date.now() >= cancelDeadline) return res.status(400).json({ error: 'too_late_to_cancel', message: '세션은 시작 15분 전까지만 취소 가능합니다.' });
    const deleted = await prisma.session.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ ok: true, session: deleted });
  } catch (err) { console.error(err); res.status(500).json({ error: 'cancel failed' }); }
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

// PATCH /api/sessions/:id/status -> change status (for host actions like cancel)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status required' });
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'not found' });
    if (String(session.hostId) !== String(req.userId)) return res.status(403).json({ error: 'forbidden' });
    if (status === 'cancelled') {
      const starts = new Date(session.startsAt).getTime();
      const cancelDeadline = starts - (15 * 60 * 1000);
      if (Date.now() >= cancelDeadline) return res.status(400).json({ error: 'too_late_to_cancel', message: '세션은 시작 15분 전까지만 취소 가능합니다.' });
    }
    const updated = await prisma.session.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'status update failed' }); }
});

// POST /api/sessions/:id/complete -> mark session done and optionally record actual duration minutes
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { actualDurationMin } = req.body || {};
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ error: 'not found' });
    // Only host or partner can mark complete
    if (String(session.hostId) !== String(req.userId) && String(session.partnerId) !== String(req.userId)) return res.status(403).json({ error: 'forbidden' });
    const data = { status: 'done' };
    const updated = await prisma.session.update({ where: { id }, data });

    if (typeof actualDurationMin === 'number' && actualDurationMin > 0) {
      // record actual duration as a sessionGoal result entry for the user
      try { await prisma.sessionGoal.create({ data: { sessionId: id, userId: req.userId, resultText: `actual:${actualDurationMin}` } }); } catch(e){ console.error('goal write failed', e); }
    }

    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'complete failed' }); }
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

// GET /api/sessions/:id/video -> list video entries (youtubeUrl)
router.get('/:id/video', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id,10);
    const items = await prisma.sessionVideo.findMany({ where: { sessionId: id }, orderBy: { setAt: 'asc' } });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'video list failed' }); }
});

module.exports = router;