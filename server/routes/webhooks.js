const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// POST /api/webhooks/toss (example)
router.post('/toss', express.json(), async (req, res) => {
  // verify signature in real impl
  const payload = req.body;
  // Example: payload contains { subscriptionId, status }
  // Map to payment/subscription records
  console.log('webhook toss payload', payload);
  res.status(200).json({ ok: true });
});

module.exports = router;
