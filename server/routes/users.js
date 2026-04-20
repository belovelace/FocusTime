const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

// PATCH /api/users/me
router.patch('/me', auth, async (req, res) => {
  const data = req.body;
  // whitelist updates
  const allowed = ['nickname','bio','avatarUrl','timezone'];
  const payload = {};
  for(const k of allowed) if(k in data) payload[k]=data[k];
  const user = await prisma.user.update({ where: { id: req.userId }, data: payload });
  res.json(user);
});

// GET /api/users/me/stats - simple weekly focused time summary
router.get('/me/stats', auth, async (req, res) => {
  try {
    // compute a 7-day window ending now
    const now = new Date();
    const end = now.toISOString();
    const startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    startDate.setHours(0,0,0,0);
    const start = startDate.toISOString();

    // sessions where the user is host or partner within the window
    const items = await prisma.session.findMany({
      where: {
        AND: [
          { startsAt: { gte: start, lt: end } },
          { OR: [ { hostId: req.userId }, { partnerId: req.userId } ] }
        ]
      }
    });

    // consider finished sessions as those whose (startsAt + duration) <= now
    const ended = items.filter(s => {
      const sStart = new Date(s.startsAt).getTime();
      const sEnd = sStart + (Number(s.durationMin || 0) * 60000);
      return sEnd <= Date.now();
    });

    const focusedMinutesWeek = ended.reduce((acc, s) => acc + Number(s.durationMin || 0), 0);
    const completedSessionsWeek = ended.length;

    // consecutiveDays: count how many consecutive days ending today the user had at least one ended session
    const daysWith = new Set(ended.map(s => (new Date(s.startsAt)).toISOString().slice(0,10)));
    let consecutive = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const key = d.toISOString().slice(0,10);
      if (daysWith.has(key)) consecutive++; else break;
    }

    res.json({ focusedMinutesWeek, completedSessionsWeek, weekGoalMinutes: null, consecutiveDays: consecutive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats failed' });
  }
});

module.exports = router;
