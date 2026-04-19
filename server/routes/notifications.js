const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  const items = await prisma.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(items);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, async (req, res) => {
  const id = parseInt(req.params.id,10);
  const n = await prisma.notification.updateMany({ where: { id, userId: req.userId }, data: { isRead: true } });
  if (n.count === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// PATCH /api/notifications (mark all read)
router.patch('/', auth, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true } });
  res.json({ ok: true });
});

module.exports = router;
