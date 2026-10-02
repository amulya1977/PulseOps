require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const { randomUUID } = require('crypto');
const { auth, adminOnly } = require('./middleware/auth');
const store = require('./utils/store');
const { runChecks, checkService } = require('./services/monitor');

const app = express();
const PORT = Number(process.env.PORT || 5000);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'PulseOps API', time: new Date().toISOString() }));

const mockDelay = { healthy: 90, warning: 650, critical: 1300, down: 4000 };
app.get('/mock/:key', async (req, res) => {
  const db = store.read();
  const mode = db.demoModes[req.params.key] || 'healthy';
  await new Promise(r => setTimeout(r, mockDelay[mode] || 90));
  if (mode === 'down') return res.status(503).json({ status: 'unavailable' });
  if (mode === 'critical') return res.status(500).json({ status: 'error' });
  res.json({ status: mode === 'warning' ? 'degraded' : 'ok' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const db = store.read();
  const user = db.users.find(u => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.password)) return res.status(401).json({ message: 'Invalid email or password' });
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'pulseops-demo-secret-change-me', { expiresIn: '12h' });
  res.json({ token, user: payload });
});

app.get('/api/me', auth, (req, res) => res.json(req.user));

app.get('/api/dashboard', auth, (req, res) => {
  const db = store.read();
  const services = db.services;
  const latest24 = db.checks.filter(c => Date.now() - new Date(c.checkedAt).getTime() <= 24*60*60*1000);
  const healthyCount = services.filter(s => s.status === 'HEALTHY').length;
  const warningCount = services.filter(s => s.status === 'WARNING').length;
  const criticalCount = services.filter(s => s.status === 'CRITICAL').length;
  const downCount = services.filter(s => s.status === 'DOWN').length;
  const avgLatency = latest24.length ? Math.round(latest24.reduce((a,c)=>a+c.latency,0)/latest24.length) : 0;
  const successes = latest24.filter(c=>c.success).length;
  const uptime = latest24.length ? Number((successes/latest24.length*100).toFixed(2)) : 100;
  const timeseries = latest24.slice(-40).map(c => ({ time: c.checkedAt, latency: c.latency, health: c.health, serviceId: c.serviceId }));
  res.json({ summary: { total: services.length, healthy: healthyCount, warning: warningCount, critical: criticalCount, down: downCount, avgLatency, uptime, openIncidents: db.incidents.filter(i=>i.status==='OPEN').length, unreadAlerts: db.alerts.filter(a=>!a.read).length }, services, timeseries, recentIncidents: db.incidents.slice(0,5), recentAlerts: db.alerts.slice(0,5) });
});

app.get('/api/services', auth, (req, res) => res.json(store.read().services));
app.post('/api/services', auth, adminOnly, (req, res) => {
  const { name, url, method='GET', expectedStatus=200, warningThreshold=500, criticalThreshold=1000, owner='Platform Team' } = req.body || {};
  if (!name || !url) return res.status(400).json({ message: 'Name and URL are required' });
  try { new URL(url); } catch { return res.status(400).json({ message: 'Please enter a valid URL' }); }
  const service = { id: randomUUID(), name, key: null, url, method, expectedStatus:Number(expectedStatus), warningThreshold:Number(warningThreshold), criticalThreshold:Number(criticalThreshold), intervalSec:20, owner, active:true, status:'UNKNOWN', createdAt:new Date().toISOString() };
  store.update(db => db.services.push(service));
  checkService(service).catch(()=>{});
  res.status(201).json(service);
});
app.put('/api/services/:id', auth, adminOnly, (req, res) => {
  let updated;
  store.update(db => {
    const s = db.services.find(x=>x.id===req.params.id); if(!s) return;
    const allowed=['name','url','method','expectedStatus','warningThreshold','criticalThreshold','owner','active'];
    for(const k of allowed) if(req.body[k] !== undefined) s[k]=req.body[k];
    updated=s;
  });
  if(!updated) return res.status(404).json({message:'Service not found'});
  res.json(updated);
});
app.delete('/api/services/:id', auth, adminOnly, (req,res)=>{
  let removed=false;
  store.update(db=>{ const before=db.services.length; db.services=db.services.filter(s=>s.id!==req.params.id); removed=before!==db.services.length; db.checks=db.checks.filter(c=>c.serviceId!==req.params.id); });
  if(!removed) return res.status(404).json({message:'Service not found'});
  res.status(204).end();
});
app.post('/api/services/:id/check', auth, async (req,res)=>{ const s=store.read().services.find(x=>x.id===req.params.id); if(!s) return res.status(404).json({message:'Service not found'}); await checkService(s); res.json({message:'Check completed'}); });
app.get('/api/services/:id/metrics', auth, (req,res)=>{
  const db=store.read(); const s=db.services.find(x=>x.id===req.params.id); if(!s) return res.status(404).json({message:'Service not found'});
  const range=req.query.range||'24h'; const ms=range==='1h'?3600000:range==='7d'?7*86400000:range==='30d'?30*86400000:86400000;
  const checks=db.checks.filter(c=>c.serviceId===s.id && Date.now()-new Date(c.checkedAt).getTime()<=ms).sort((a,b)=>new Date(a.checkedAt)-new Date(b.checkedAt));
  const success=checks.filter(c=>c.success).length; const avg=checks.length?Math.round(checks.reduce((a,c)=>a+c.latency,0)/checks.length):0;
  res.json({ service:s, checks, stats:{ totalChecks:checks.length, avgLatency:avg, uptime:checks.length?Number((success/checks.length*100).toFixed(2)):100, failures:checks.length-success } });
});

app.get('/api/incidents', auth, (req,res)=>res.json(store.read().incidents));
app.get('/api/alerts', auth, (req,res)=>res.json(store.read().alerts));
app.patch('/api/alerts/:id/read', auth, (req,res)=>{ let a; store.update(db=>{a=db.alerts.find(x=>x.id===req.params.id); if(a)a.read=true;}); if(!a)return res.status(404).json({message:'Alert not found'}); res.json(a); });
app.patch('/api/alerts/read-all', auth, (req,res)=>{store.update(db=>db.alerts.forEach(a=>a.read=true));res.json({message:'All alerts marked read'});});

app.get('/api/settings', auth, adminOnly, (req,res)=>res.json(store.read().settings));
app.put('/api/settings', auth, adminOnly, (req,res)=>{let settings; store.update(db=>{db.settings={...db.settings,...req.body}; settings=db.settings;});res.json(settings);});

app.post('/api/demo/mode', auth, adminOnly, (req,res)=>{
  const { key, mode } = req.body || {}; const allowed=['healthy','warning','critical','down'];
  if(!key || !allowed.includes(mode)) return res.status(400).json({message:'Invalid key or mode'});
  store.update(db=>{db.demoModes[key]=mode;});
  const s=store.read().services.find(x=>x.key===key); if(s) checkService(s).catch(()=>{});
  res.json({key,mode});
});
app.get('/api/demo/modes', auth, (req,res)=>res.json(store.read().demoModes));
app.post('/api/demo/reset', auth, adminOnly, (req,res)=>{store.reset();res.json({message:'Demo data reset'});});
app.post('/api/monitor/run', auth, adminOnly, async (req,res)=>{await runChecks();res.json({message:'Monitoring cycle completed'});});

app.get('/api/reports/csv', auth, (req,res)=>{
  const db=store.read();
  const rows=['Service,Status,Owner,Last Latency (ms),Last HTTP Status,Last Checked'];
  for(const s of db.services) rows.push([s.name,s.status,s.owner,s.lastLatency??'',s.lastStatusCode??'',s.lastCheckedAt??''].map(v=>`"${String(v).replaceAll('"','""')}"`).join(','));
  res.type('text/csv').set('Content-Disposition','attachment; filename="pulseops-service-report.csv"').send(rows.join('\n'));
});

app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:'Unexpected server error'});});

cron.schedule('*/20 * * * * *', () => runChecks().catch(console.error));
app.listen(PORT, async ()=>{ console.log(`PulseOps backend running on http://localhost:${PORT}`); setTimeout(()=>runChecks().catch(console.error),600); });
