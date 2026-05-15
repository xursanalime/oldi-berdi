// In-memory database for demo (can be replaced with PostgreSQL + Prisma)
// This keeps state across API calls within the same server session

const { v4: uuidv4 } = require('uuid');

// Demo users
const users = [
  { id: 'u1', phone: '901234567', name: 'Alisher Karimov', createdAt: new Date().toISOString() },
  { id: 'u2', phone: '991112233', name: 'Nodira Toshmatova', createdAt: new Date().toISOString() },
  { id: 'u3', phone: '935556677', name: 'Bobur Hasanov', createdAt: new Date().toISOString() },
];

// Demo debts
const debts = [
  {
    id: 'd1',
    amount: 5000000,
    reason: 'Uy ta\'miri uchun',
    dueDate: '2026-06-15',
    status: 'active',
    creatorId: 'u1',
    counterpartyId: 'u2',
    creatorRole: 'lender',
    creatorConfirmed: true,
    counterpartyConfirmed: true,
    createdAt: '2026-05-01T10:00:00Z',
    confirmedAt: '2026-05-01T12:00:00Z',
    closedAt: null,
  },
  {
    id: 'd2',
    amount: 2000000,
    reason: 'Telefon sotib olish',
    dueDate: '2026-05-20',
    status: 'pending',
    creatorId: 'u3',
    counterpartyId: 'u1',
    creatorRole: 'borrower',
    creatorConfirmed: true,
    counterpartyConfirmed: false,
    createdAt: '2026-05-10T14:00:00Z',
    confirmedAt: null,
    closedAt: null,
  },
  {
    id: 'd3',
    amount: 1500000,
    reason: 'Kurs to\'lovi',
    dueDate: '2026-04-30',
    status: 'overdue',
    creatorId: 'u1',
    counterpartyId: 'u3',
    creatorRole: 'lender',
    creatorConfirmed: true,
    counterpartyConfirmed: true,
    createdAt: '2026-03-15T09:00:00Z',
    confirmedAt: '2026-03-15T11:00:00Z',
    closedAt: null,
  },
  {
    id: 'd4',
    amount: 3000000,
    reason: 'Mashina ta\'miri',
    dueDate: '2026-03-01',
    status: 'closed',
    creatorId: 'u2',
    counterpartyId: 'u1',
    creatorRole: 'lender',
    creatorConfirmed: true,
    counterpartyConfirmed: true,
    createdAt: '2026-01-10T08:00:00Z',
    confirmedAt: '2026-01-10T10:00:00Z',
    closedAt: '2026-02-28T16:00:00Z',
  },
];

const auditLogs = [
  { id: 'a1', debtId: 'd1', userId: 'u1', action: 'created', timestamp: '2026-05-01T10:00:00Z', metadata: '{}' },
  { id: 'a2', debtId: 'd1', userId: 'u2', action: 'confirmed', timestamp: '2026-05-01T12:00:00Z', metadata: '{}' },
];

// OTP store
const otpStore = {};

// Helper functions
function getUserByPhone(phone) {
  return users.find(u => u.phone === phone) || null;
}

function getUserById(id) {
  return users.find(u => u.id === id) || null;
}

function createUser(phone, name) {
  const user = { id: uuidv4(), phone, name, createdAt: new Date().toISOString() };
  users.push(user);
  return user;
}

function getDebtsForUser(userId) {
  return debts.filter(d => d.creatorId === userId || d.counterpartyId === userId);
}

function getDebtById(debtId) {
  return debts.find(d => d.id === debtId) || null;
}

function createDebt({ amount, reason, dueDate, creatorId, counterpartyId, creatorRole }) {
  const debt = {
    id: uuidv4(),
    amount,
    reason,
    dueDate,
    status: 'pending',
    creatorId,
    counterpartyId,
    creatorRole,
    creatorConfirmed: true,
    counterpartyConfirmed: false,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    closedAt: null,
  };
  debts.push(debt);
  addAuditLog(debt.id, creatorId, 'created');
  return debt;
}

function confirmDebt(debtId, userId) {
  const debt = debts.find(d => d.id === debtId);
  if (!debt) return null;
  
  if (debt.counterpartyId === userId) {
    debt.counterpartyConfirmed = true;
  }
  
  if (debt.creatorConfirmed && debt.counterpartyConfirmed) {
    debt.status = 'active';
    debt.confirmedAt = new Date().toISOString();
  }
  
  addAuditLog(debtId, userId, 'confirmed');
  return debt;
}

function rejectDebt(debtId, userId) {
  const debt = debts.find(d => d.id === debtId);
  if (!debt) return null;
  debt.status = 'cancelled';
  addAuditLog(debtId, userId, 'rejected');
  return debt;
}

function closeDebt(debtId, userId) {
  const debt = debts.find(d => d.id === debtId);
  if (!debt) return null;
  
  // Mark user's confirmation for closing
  if (!debt._closeConfirms) debt._closeConfirms = [];
  if (!debt._closeConfirms.includes(userId)) {
    debt._closeConfirms.push(userId);
  }
  
  // Both parties must confirm
  if (debt._closeConfirms.length >= 2) {
    debt.status = 'closed';
    debt.closedAt = new Date().toISOString();
    addAuditLog(debtId, userId, 'closed');
  } else {
    addAuditLog(debtId, userId, 'close_requested');
  }
  
  return debt;
}

function addAuditLog(debtId, userId, action, metadata = '{}') {
  auditLogs.push({
    id: uuidv4(),
    debtId,
    userId,
    action,
    timestamp: new Date().toISOString(),
    metadata,
  });
}

function getAuditLogs(debtId) {
  return auditLogs.filter(l => l.debtId === debtId);
}

function getUserStats(userId) {
  const userDebts = getDebtsForUser(userId);
  let totalLent = 0;
  let totalBorrowed = 0;
  let activeCount = 0;
  let pendingCount = 0;
  
  userDebts.forEach(d => {
    const isLender = (d.creatorId === userId && d.creatorRole === 'lender') ||
                     (d.counterpartyId === userId && d.creatorRole === 'borrower');
    
    if (d.status === 'active' || d.status === 'overdue') {
      activeCount++;
      if (isLender) totalLent += d.amount;
      else totalBorrowed += d.amount;
    }
    
    if (d.status === 'pending') {
      pendingCount++;
    }
  });
  
  return { totalLent, totalBorrowed, activeCount, pendingCount };
}

module.exports = {
  users, debts, auditLogs, otpStore,
  getUserByPhone, getUserById, createUser,
  getDebtsForUser, getDebtById, createDebt,
  confirmDebt, rejectDebt, closeDebt,
  addAuditLog, getAuditLogs, getUserStats,
};
