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

module.exports = router;
