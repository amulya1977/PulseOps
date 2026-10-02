export default function StatusBadge({status}){ const s=(status||'UNKNOWN').toUpperCase(); return <span className={`status-badge ${s.toLowerCase()}`}><span className="badge-dot"/>{s}</span> }
