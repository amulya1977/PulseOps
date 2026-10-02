const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const file = path.join(__dirname, '../../data/db.json');

function now() { return new Date().toISOString(); }

function seed() {
  const passwordAdmin = bcrypt.hashSync('admin123', 10);
  const passwordDev = bcrypt.hashSync('dev123', 10);
  const baseUrl = 'http://localhost:5000/mock';
  const services = [
    { id: randomUUID(), name: 'Authentication API', key: 'auth', url: `${baseUrl}/auth`, method: 'GET', expectedStatus: 200, warningThreshold: 450, criticalThreshold: 900, intervalSec: 20, active: true, status: 'HEALTHY', createdAt: now(), owner: 'Platform Team' },
    { id: randomUUID(), name: 'Payment API', key: 'payments', url: `${baseUrl}/payments`, method: 'GET', expectedStatus: 200, warningThreshold: 500, criticalThreshold: 1000, intervalSec: 20, active: true, status: 'CRITICAL', createdAt: now(), owner: 'Payments Team' },
    { id: randomUUID(), name: 'Orders API', key: 'orders', url: `${baseUrl}/orders`, method: 'GET', expectedStatus: 200, warningThreshold: 500, criticalThreshold: 1000, intervalSec: 20, active: true, status: 'WARNING', createdAt: now(), owner: 'Commerce Team' },
    { id: randomUUID(), name: 'Notification API', key: 'notifications', url: `${baseUrl}/notifications`, method: 'GET', expectedStatus: 200, warningThreshold: 500, criticalThreshold: 1000, intervalSec: 20, active: true, status: 'HEALTHY', createdAt: now(), owner: 'Engagement Team' },
    { id: randomUUID(), name: 'Inventory API', key: 'inventory', url: `${baseUrl}/inventory`, method: 'GET', expectedStatus: 200, warningThreshold: 500, criticalThreshold: 1000, intervalSec: 20, active: true, status: 'HEALTHY', createdAt: now(), owner: 'Supply Team' }
  ];
  return {
    users: [
      { id: randomUUID(), name: 'PulseOps Admin', email: 'admin@pulseops.dev', password: passwordAdmin, role: 'admin' },
      { id: randomUUID(), name: 'Demo Developer', email: 'dev@pulseops.dev', password: passwordDev, role: 'developer' }
    ],
    services,
    checks: [],
    incidents: [],
    alerts: [],
    demoModes: { auth: 'healthy', payments: 'critical', orders: 'warning', notifications: 'healthy', inventory: 'healthy' },
    settings: { monitoringEnabled: true, defaultIntervalSec: 20, retainDays: 30, emailAlerts: false }
  };
}

function ensure() {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(seed(), null, 2));
}
function read() { ensure(); return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); return data; }
function update(mutator) { const db = read(); const result = mutator(db); write(db); return result; }
function reset() { const data = seed(); write(data); return data; }
module.exports = { read, write, update, reset, now };
