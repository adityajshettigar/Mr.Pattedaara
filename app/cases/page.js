'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { casesApi } from '../../lib/apiClient';
import { useAuth } from '../../lib/authContext';

const PRIORITY_COLOR={critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#6b7280'};
const PRIORITY_LABEL={critical:'Critical',high:'High',medium:'Medium',low:'Low'};
const STATUS_BADGE={'new':'badge-blue','under-investigation':'badge-amber','escalated':'badge-red','pending-court':'badge-purple','closed':'badge-gray'};
const STATUS_LABEL={'new':'New','under-investigation':'Under Investigation','escalated':'Escalated','pending-court':'Pending Court','closed':'Closed'};
const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);

export default function CasesPage(){
  const router=useRouter();const{isRole}=useAuth();
  const[cases,setCases]=useState([]);const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');const[filter,setFilter]=useState('all');const[pFilter,setPFilter]=useState('all');
  
  // 🟢 FIXED: 'd' is already the unwrapped array from apiClient
  useEffect(()=>{
    casesApi.list()
      .then(d => { setCases(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  },[]);

  const filtered=cases.filter(c=>{
    const q=search.toLowerCase();
    const ms=!q||c.title.toLowerCase().includes(q)||c.id.includes(q)||(c.fir||'').toLowerCase().includes(q)||(c.victim?.name||'').toLowerCase().includes(q);
    const mst=filter==='all'||c.status===filter;const mp=pFilter==='all'||c.priority===pFilter;
    return ms&&mst&&mp;
  });

  const handleDelete=async(e,id)=>{
    e.stopPropagation();if(!confirm('Delete this case? Cannot be undone.'))return;
    try{await casesApi.delete(id);setCases(c=>c.filter(x=>x.id!==id));}catch(e){alert(e.message);}
  };

  return(
    <div className="content animate-in">
      <div className="page-header">
        <div><div className="page-title font-display">Case Files</div><div className="page-sub font-mono">{cases.length} total · {cases.filter(c=>c.status!=='closed').length} active</div></div>
        <button className="btn btn-primary" onClick={()=>router.push('/cases/new')}>+ New Case</button>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <input placeholder="Search cases, FIR, victim…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:280,flex:'none'}}/>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{width:190}}>
          <option value="all">All Statuses</option><option value="new">New</option><option value="under-investigation">Under Investigation</option><option value="escalated">Escalated</option><option value="pending-court">Pending Court</option><option value="closed">Closed</option>
        </select>
        <select value={pFilter} onChange={e=>setPFilter(e.target.value)} style={{width:160}}>
          <option value="all">All Priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>
      {loading?<div style={{textAlign:'center',padding:'44px',color:'var(--text3)'}}><span className="spinning">⟳</span></div>:(
        <div className="cases-grid">
          {filtered.map(c=>(
            <div key={c.id} className={`case-card priority-${c.priority}`} onClick={()=>router.push(`/cases/${c.id}`)}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span className="case-id">{c.id.toUpperCase()}</span>{c.fir&&<span style={{fontSize:11,color:'var(--text3)'}}>· {c.fir}</span>}</div>
                <div className="case-title truncate">{c.title}</div>
                <div className="case-meta"><span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span><span className="badge badge-gray">{c.classification}</span>{c.district&&<span style={{fontSize:11,color:'var(--text3)'}}>{c.district}</span>}<span style={{fontSize:11,color:'var(--text3)'}}>{c.officer}</span></div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:PRIORITY_COLOR[c.priority],display:'block'}}/><span style={{fontSize:11,fontWeight:600,color:PRIORITY_COLOR[c.priority]}}>{PRIORITY_LABEL[c.priority]}</span></div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--red)'}}>{fmt(c.victim?.lossAmount||0)}</div>
                <div className="font-mono" style={{fontSize:10,color:'var(--text3)'}}>{c.lastUpdated}</div>
                {isRole('superintendent')&&<button className="btn btn-danger btn-sm" onClick={e=>handleDelete(e,c.id)}>🗑</button>}
              </div>
            </div>
          ))}
          {filtered.length===0&&<div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">{search?'No cases match your search.':'No cases yet.'}</div></div>}
        </div>
      )}
    </div>
  );
}