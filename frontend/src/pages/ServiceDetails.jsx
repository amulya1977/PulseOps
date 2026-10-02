import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, CheckCircle2, Clock3, PlayCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
export default function ServiceDetails(){
 const {id}=useParams(); const [range,setRange]=useState('24h'); const [data,setData]=useState(null); const load=()=>api(`/services/${id}/metrics?range=${range}`).then(setData); useEffect(()=>{load()},[id,range]);
 if(!data)return <div className="loading">Loading service metrics…</div>; const {service,checks,stats}=data; const latest=[...checks].reverse().slice(0,20);
 return <><div className="page-head"><div><div className="eyebrow">SERVICE DETAILS</div><div className="title-row"><h1>{service.name}</h1><StatusBadge status={service.status}/></div><p>{service.url}</p></div><div className="head-actions"><select value={range} onChange={e=>setRange(e.target.value)}><option value="1h">Last 1 hour</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><button className="primary-btn" onClick={async()=>{await api(`/services/${id}/check`,{method:'POST'});setTimeout(load,500)}}><PlayCircle size={17}/> Run check</button></div></div>
 <div className="stats-grid"><StatCard label="Current latency" value={`${service.lastLatency??0} ms`} sub="Latest check" icon={Clock3}/><StatCard label="Uptime" value={`${stats.uptime}%`} sub={`${stats.totalChecks} checks`} icon={CheckCircle2} tone="green"/><StatCard label="Failures" value={stats.failures} sub="Selected range" icon={XCircle} tone="orange"/><StatCard label="Average latency" value={`${stats.avgLatency} ms`} sub="Selected range" icon={Activity} tone="violet"/></div>
 <section className="panel"><div className="panel-head"><div><h3>Response time</h3><p>Latency measured by synthetic HTTP checks</p></div></div><LineChart data={checks}/></section>
 <section className="panel"><div className="panel-head"><div><h3>Recent checks</h3><p>Latest monitoring results for this endpoint</p></div></div><div className="table-wrap"><table><thead><tr><th>Time</th><th>Health</th><th>HTTP</th><th>Latency</th><th>Result</th></tr></thead><tbody>{latest.map(c=><tr key={c.id}><td>{new Date(c.checkedAt).toLocaleString()}</td><td><StatusBadge status={c.health}/></td><td>{c.statusCode??'—'}</td><td>{c.latency} ms</td><td>{c.errorMessage||'Response received successfully'}</td></tr>)}</tbody></table></div></section></>
}
