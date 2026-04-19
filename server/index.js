const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');

// Ensure BigInt can be JSON-stringified (used by JWT signing in tests and elsewhere)
if (typeof BigInt !== 'undefined' && typeof BigInt.prototype.toJSON !== 'function') {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function () { return this.toString(); },
    configurable: true,
    writable: true,
  });
}
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const notificationRoutes = require('./routes/notifications');
const subscriptionRoutes = require('./routes/subscriptions');
const webhookRoutes = require('./routes/webhooks');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const path = require('path');

// Serve frontWorkspace static files under /app
app.use('/app', express.static(path.join(__dirname, '..', 'frontWorkspace')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
} else {
  console.log('Server not started (required as module)');
}

module.exports = app;
