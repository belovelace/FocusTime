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

// GET /api/users/me/stats - weekly focused time summary with Monday-start week and per-day totals
router.get('/me/stats', auth, async (req, res) => {
  try {
    // find current date and compute Monday of current week (local timezone)
    const now = new Date();
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const daysSinceMonday = (day + 6) % 7; // Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0,0,0,0);
    const weekStart = new Date(monday);

    // Build per-day range for 7 days starting Monday
    const dayRanges = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      dayRanges.push({ start: start.toISOString(), end: end.toISOString(), key: start.toISOString().slice(0,10) });
    }

    // fetch sessions in this week where user is host or partner
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const items = await prisma.session.findMany({ where: { AND: [ { startsAt: { gte: weekStart.toISOString(), lt: weekEnd.toISOString() } }, { OR: [ { hostId: req.userId }, { partnerId: req.userId } ] } ] } });

    // compute per-day completed minutes: session is completed if startsAt + duration <= now
    const perDay = {};
    dayRanges.forEach(r => perDay[r.key] = { minutes: 0, sessions: [] });

    // iterate sessions and prefer actual duration recorded in sessionGoal (resultText: 'actual:NN') for this user
    for (const s of items) {
      const sStart = new Date(s.startsAt).getTime();
      const sEnd = sStart + (Number(s.durationMin || 0) * 60000);
      const dayKey = new Date(s.startsAt).toISOString().slice(0,10);
      if (sEnd <= Date.now()) {
        // check for recorded actual duration for this user
        let actual = null;
        try {
          const goals = await prisma.sessionGoal.findMany({ where: { sessionId: s.id, userId: req.userId } });
          for (const g of goals) {
            if (g.resultText && typeof g.resultText === 'string' && g.resultText.startsWith('actual:')) {
              const v = parseInt(g.resultText.split(':')[1], 10);
              if (!isNaN(v)) { actual = v; break; }
            }
          }
        } catch (e) { /* ignore per-session goal errors */ }

        const mins = actual != null ? actual : Number(s.durationMin || 0);
        if (perDay[dayKey]) {
          perDay[dayKey].minutes += mins;
          perDay[dayKey].sessions.push({ id: s.id, startsAt: s.startsAt, durationMin: s.durationMin, actualDurationMin: mins, status: s.status });
        }
      }
    }

    const focusedMinutesWeek = Object.values(perDay).reduce((acc, v) => acc + v.minutes, 0);
    const completedSessionsWeek = Object.values(perDay).reduce((acc, v) => acc + v.sessions.length, 0);

    res.json({ weekStart: weekStart.toISOString().slice(0,10), focusedMinutesWeek, completedSessionsWeek, perDay, weekDays: dayRanges.map(r => r.key) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'stats failed' });
  }
});

module.exports = router;
