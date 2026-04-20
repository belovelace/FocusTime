const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// All routes require auth
router.use(auth);

// GET / -> list favorites (returns partner user objects)
router.get('/', async (req, res) => {
  try {
    const items = await prisma.favorite.findMany({ where: { userId: req.userId }, include: { partner: { select: { id: true, nickname: true, avatarUrl: true, email: true } } } });
    const partners = items.map(i => i.partner);
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'list failed' });
  }
});

// POST /:partnerId -> add favorite
router.post('/:partnerId', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.partnerId, 10);
    if (!partnerId || isNaN(partnerId)) return res.status(400).json({ error: 'invalid partnerId' });
    // prevent favoriting self
    if (String(req.userId) === String(partnerId)) return res.status(400).json({ error: 'cannot favorite yourself' });

    const count = await prisma.favorite.count({ where: { userId: req.userId } });
    if (count >= 50) return res.status(403).json({ error: 'favorites limit' });

    const fav = await prisma.favorite.create({ data: { userId: req.userId, partnerId } });
    res.status(201).json(fav);
  } catch (err) {
    // handle unique constraint (already favorited)
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'already favorited' });
    res.status(500).json({ error: 'create failed' });
  }
});

// DELETE /:partnerId -> remove favorite
router.delete('/:partnerId', async (req, res) => {
  try {
    const partnerId = parseInt(req.params.partnerId, 10);
    if (!partnerId || isNaN(partnerId)) return res.status(400).json({ error: 'invalid partnerId' });
    const deleted = await prisma.favorite.delete({ where: { userId_partnerId: { userId: req.userId, partnerId } } });
    res.json(deleted);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'not found' });
    res.status(500).json({ error: 'delete failed' });
  }
});

module.exports = router;
