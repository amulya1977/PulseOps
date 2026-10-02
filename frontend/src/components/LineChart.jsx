export default function LineChart({data=[]}){
 const width=760,height=220,pad=24; if(!data.length) return <div className="empty-chart">Waiting for monitoring data…</div>;
 const vals=data.map(d=>Number(d.latency||0)); const max=Math.max(100,...vals)*1.15; const min=0;
 const pts=vals.map((v,i)=>{const x=pad+(i*(width-pad*2))/Math.max(1,vals.length-1); const y=height-pad-((v-min)/(max-min||1))*(height-pad*2); return [x,y]});
 const path=pts.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ');
 return <svg viewBox={`0 0 ${width} ${height}`} className="line-chart" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".25"/><stop offset="100%" stopColor="currentColor" stopOpacity=".02"/></linearGradient></defs>{[.25,.5,.75].map(v=><line key={v} x1={pad} x2={width-pad} y1={pad+(height-pad*2)*v} y2={pad+(height-pad*2)*v} className="grid-line"/>)}<path d={`${path} L ${pts.at(-1)[0]} ${height-pad} L ${pts[0][0]} ${height-pad} Z`} fill="url(#area)"/><path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{pts.filter((_,i)=>i===pts.length-1).map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="5" fill="currentColor"/>)}</svg>
}
