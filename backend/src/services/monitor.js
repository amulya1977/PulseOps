const { update, read, now } = require('../utils/store');
const { randomUUID } = require('crypto');

function classify(statusCode, latency, err, service) {
  if (err) return 'DOWN';
  if (statusCode >= 500) return 'CRITICAL';
  if (statusCode !== Number(service.expectedStatus || 200)) return 'WARNING';
  if (latency >= Number(service.criticalThreshold || 1000)) return 'CRITICAL';
  if (latency >= Number(service.warningThreshold || 500)) return 'WARNING';
  return 'HEALTHY';
}

async function checkService(service) {
  const started = Date.now();
  let statusCode = null, errorMessage = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(service.url, { method: service.method || 'GET', signal: controller.signal });
    clearTimeout(timer);
    statusCode = response.status;
  } catch (err) {
    errorMessage = err.name === 'AbortError' ? 'Request timed out' : (err.message || 'Connection failed');
  }
  const latency = Date.now() - started;
  const health = classify(statusCode, latency, errorMessage, service);
  const checkedAt = now();

  update(db => {
    const s = db.services.find(x => x.id === service.id);
    if (!s) return;
    const previous = s.status;
    s.status = health;
    s.lastCheckedAt = checkedAt;
    s.lastLatency = latency;
    s.lastStatusCode = statusCode;

    db.checks.push({ id: randomUUID(), serviceId: s.id, statusCode, latency, health, success: health === 'HEALTHY' || health === 'WARNING', checkedAt, errorMessage });
    if (db.checks.length > 5000) db.checks = db.checks.slice(-5000);

    const openIncident = db.incidents.find(i => i.serviceId === s.id && i.status === 'OPEN');
    const unhealthy = health === 'CRITICAL' || health === 'DOWN';
    if (unhealthy && !openIncident) {
      const incident = { id: randomUUID(), serviceId: s.id, serviceName: s.name, title: `${s.name} ${health === 'DOWN' ? 'unavailable' : 'degraded'}`, severity: health === 'DOWN' ? 'CRITICAL' : 'HIGH', reason: errorMessage || `HTTP ${statusCode || 'N/A'} / ${latency} ms`, status: 'OPEN', startedAt: checkedAt, resolvedAt: null };
      db.incidents.unshift(incident);
      db.alerts.unshift({ id: randomUUID(), serviceId: s.id, message: `${incident.title}: ${incident.reason}`, severity: incident.severity, read: false, createdAt: checkedAt });
    }
    if (!unhealthy && openIncident) {
      openIncident.status = 'RESOLVED';
      openIncident.resolvedAt = checkedAt;
      db.alerts.unshift({ id: randomUUID(), serviceId: s.id, message: `${s.name} recovered and is now ${health}.`, severity: 'INFO', read: false, createdAt: checkedAt });
    }
    if (previous && previous !== health && health === 'WARNING') {
      db.alerts.unshift({ id: randomUUID(), serviceId: s.id, message: `${s.name} entered warning state (${latency} ms).`, severity: 'MEDIUM', read: false, createdAt: checkedAt });
    }
    db.alerts = db.alerts.slice(0, 300);
  });
}

async function runChecks() {
  const db = read();
  if (!db.settings.monitoringEnabled) return;
  const active = db.services.filter(s => s.active);
  await Promise.all(active.map(checkService));
}

module.exports = { runChecks, checkService, classify };
