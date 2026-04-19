const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

// GET /api/subscriptions/me
router.get('/me', auth, async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  res.json(sub || { plan: 'free' });
});

// POST /api/subscriptions/checkout
router.post('/checkout', auth, async (req, res) => {
  const { plan } = req.body;
  // For demo: create subscription record pending and return fake checkout token
  const sub = await prisma.subscription.upsert({ where: { userId: req.userId }, update: { plan }, create: { userId: req.userId, plan } });
  // In real app integrate Toss/TossPayments/PortOne and return redirect URL or payment token
  res.json({ checkoutUrl: 'https://payment.example/checkout?token=demo', subscription: sub });
});

module.exports = router;
