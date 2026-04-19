// Lightweight Prisma mock for tests (NODE_ENV=test) or real Prisma in non-test env
if (process.env.NODE_ENV === 'test') {
  const store = {
    users: [], sessions: [], sessionParticipants: [], sessionMessages: [], sessionGoals: [], notifications: [], subscriptions: []
  };
  const ids = { users: 1, sessions: 1, participants: 1, messages: 1, goals: 1, notifications: 1, subscriptions: 1 };

  const matchWhere = (obj, where) => {
    if (!where) return true;
    for (const k of Object.keys(where)) {
      if (typeof where[k] === 'object' && where[k] !== null) {
        const val = obj[k];
        if (where[k].gte && !(new Date(val) >= new Date(where[k].gte))) return false;
        if (where[k].lt && !(new Date(val) < new Date(where[k].lt))) return false;
        if (where[k].equals && val !== where[k].equals) return false;
      } else {
        if (obj[k] !== where[k]) return false;
      }
    }
    return true;
  };

  const prismaMock = {
    user: {
      create: async ({ data }) => { const u = { id: ids.users++, ...data }; store.users.push(u); return u; },
      findUnique: async ({ where }) => {
        if (where.email) return store.users.find(u => u.email === where.email) || null;
        if (where.id) return store.users.find(u => u.id === where.id) || null;
        return null;
      },
      deleteMany: async ({ where }) => { const before = store.users.length; store.users = store.users.filter(u => !matchWhere(u, where)); return { count: before - store.users.length }; }
    },
    session: {
      create: async ({ data }) => { const s = { id: ids.sessions++, ...data }; store.sessions.push(s); return s; },
      findUnique: async ({ where }) => store.sessions.find(s => s.id === where.id) || null,
      findMany: async ({ where, skip = 0, take = 20, orderBy }) => {
        let arr = store.sessions.filter(s => matchWhere(s, where));
        if (orderBy && orderBy.startsAt) arr = arr.sort((a,b) => a.startsAt < b.startsAt ? -1 : 1);
        return arr.slice(skip, skip+take);
      },
      count: async ({ where }) => store.sessions.filter(s => matchWhere(s, where)).length,
      updateMany: async ({ where, data }) => {
        let count = 0;
        store.sessions = store.sessions.map(s => { if (matchWhere(s, where)) { count++; return { ...s, ...data }; } return s; });
        return { count };
      },
      deleteMany: async ({ where }) => { const before = store.sessions.length; store.sessions = store.sessions.filter(s => !matchWhere(s, where)); return { count: before - store.sessions.length }; }
    },
    sessionParticipant: {
      create: async ({ data }) => { const p = { id: ids.participants++, ...data }; store.sessionParticipants.push(p); return p; },
      deleteMany: async ({ where }) => { const before = store.sessionParticipants.length; store.sessionParticipants = store.sessionParticipants.filter(p => !matchWhere(p, where)); return { count: before - store.sessionParticipants.length }; }
    },
    sessionMessage: {
      create: async ({ data }) => { const m = { id: ids.messages++, sentAt: new Date().toISOString(), ...data }; store.sessionMessages.push(m); return m; },
      findMany: async ({ where, orderBy, skip = 0, take = 50 }) => { let arr = store.sessionMessages.filter(m => matchWhere(m, where)); if (orderBy && orderBy.sentAt === 'desc') arr = arr.sort((a,b)=>a.sentAt<b.sentAt?1:-1); return arr.slice(skip, skip+take); },
      deleteMany: async ({ where }) => { const before = store.sessionMessages.length; store.sessionMessages = store.sessionMessages.filter(m => !matchWhere(m, where)); return { count: before - store.sessionMessages.length }; }
    },
    sessionGoal: {
      create: async ({ data }) => { const g = { id: ids.goals++, createdAt: new Date().toISOString(), ...data }; store.sessionGoals.push(g); return g; },
      findMany: async ({ where }) => store.sessionGoals.filter(g => matchWhere(g, where)),
      deleteMany: async ({ where }) => { const before = store.sessionGoals.length; store.sessionGoals = store.sessionGoals.filter(g => !matchWhere(g, where)); return { count: before - store.sessionGoals.length }; }
    },
    notification: {
      createMany: async ({ data }) => { for (const d of data) { const n = { id: ids.notifications++, createdAt: new Date().toISOString(), isRead: false, ...d }; store.notifications.push(n); } return { count: data.length }; },
      findMany: async ({ where, orderBy, take = 100 }) => store.notifications.filter(n => matchWhere(n, where)).slice(0,take),
      updateMany: async ({ where, data }) => { let count = 0; store.notifications = store.notifications.map(n => { if (matchWhere(n, where)) { count++; return { ...n, ...data }; } return n; }); return { count }; }
    },
    subscription: {
      findUnique: async ({ where }) => store.subscriptions.find(s => s.userId === where.userId) || null,
      upsert: async ({ where, update, create }) => { const existing = store.subscriptions.find(s => s.userId === where.userId); if (existing) { Object.assign(existing, update); return existing; } const item = { id: ids.subscriptions++, ...create }; store.subscriptions.push(item); return item; },
      deleteMany: async ({ where }) => { const before = store.subscriptions.length; store.subscriptions = store.subscriptions.filter(s => !matchWhere(s, where)); return { count: before - store.subscriptions.length }; }
    },
    $disconnect: async () => {}
  };
  module.exports = prismaMock;
} else {
  const { PrismaClient } = require('@prisma/client');

  // Prefer explicit test DB URL if provided, otherwise fall back to DATABASE_URL
  const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') {
    throw new Error('DATABASE_URL_TEST or DATABASE_URL must be set to initialize PrismaClient');
  }

  // Use a singleton Prisma client in non-production to avoid too many instances
  const globalForPrisma = globalThis;
  let prisma;
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!globalForPrisma.__prisma) {
      globalForPrisma.__prisma = new PrismaClient();
    }
    prisma = globalForPrisma.__prisma;
  }

  module.exports = prisma;
}
