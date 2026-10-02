import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, Bell, Boxes, Gauge, LogOut, Settings as SettingsIcon, Siren, ShieldCheck } from 'lucide-react';
const nav=[['/','Overview',Gauge],['/services','Services',Boxes],['/incidents','Incidents',Siren],['/alerts','Alerts',Bell],['/settings','Settings',SettingsIcon]];
export default function Layout({children}){
 const navigate=useNavigate(); const user=JSON.parse(localStorage.getItem('pulseops_user')||'{}');
 return <div className="app-shell">
   <aside className="sidebar">
     <div className="brand"><div className="brand-mark"><Activity size={22}/></div><div><div className="brand-name">PulseOps</div><div className="brand-sub">Service Intelligence</div></div></div>
     <div className="side-label">WORKSPACE</div>
     <nav>{nav.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
     <div className="side-spacer"/>
     <div className="security-pill"><ShieldCheck size={17}/><span>Monitoring protected</span></div>
     <div className="user-box"><div className="avatar">{(user.name||'P')[0]}</div><div className="user-meta"><b>{user.name||'PulseOps User'}</b><span>{user.role||'developer'}</span></div><button onClick={()=>{localStorage.clear();navigate('/login')}} className="icon-btn" title="Logout"><LogOut size={17}/></button></div>
   </aside>
   <main className="main-panel"><header className="topbar"><div><span className="status-dot"/> Monitoring active</div><div className="topbar-right">Internal Platform • Demo Environment</div></header><div className="page-wrap">{children}</div></main>
 </div>
}
