'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { casesApi } from '../../lib/apiClient';
import { useAuth } from '../../lib/authContext';

const PRIORITY_COLOR={critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#6b7280'};
const STATUS_LABEL={'new':'New','under-investigation':'Under Investigation','escalated':'Escalated','pending-court':'Pending Court','closed':'Closed'};
const STATUS_BADGE={'new':'badge-blue','under-investigation':'badge-amber','escalated':'badge-red','pending-court':'badge-purple','closed':'badge-gray'};
const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);

export default function Dashboard() {
  const router=useRouter();const{user}=useAuth();
  const[cases,setCases]=useState([]);const[loading,setLoading]=useState(true);
  useEffect(() => {
    casesApi.list()
      .then(data => {
        // 'data' is already the array returned from apiClient
        setCases(data || []); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cases:", err);
        setLoading(false);
      });
  }, []);
  const totalLoss=cases.reduce((s,c)=>s+(c.victim?.lossAmount||0),0);
  const openCases=cases.filter(c=>c.status!=='closed').length;
  const critCases=cases.filter(c=>c.priority==='critical').length;
  const byType=cases.reduce((a,c)=>({...a,[c.classification]:(a[c.classification]||0)+1}),{});
  return(
    <div className="content animate-in">
      <div className="page-header">
        <div><div className="page-title font-display">Intelligence Dashboard</div><div className="page-sub font-mono">Welcome back, {user?.name} · {new Date().toLocaleDateString('en-IN',{dateStyle:'long'})}</div></div>
        <button className="btn btn-primary" onClick={()=>router.push('/cases/new')}>+ New Case</button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val">{loading?'…':cases.length}</div><div className="stat-label">Total Cases</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:'var(--orange)'}}>{loading?'…':openCases}</div><div className="stat-label">Active Cases</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:'var(--red)'}}>{loading?'…':critCases}</div><div className="stat-label">Critical Priority</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:'var(--green)',fontSize:22}}>{loading?'…':fmt(totalLoss)}</div><div className="stat-label">Total Loss Recorded</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16}}>
        <div className="card">
          <div className="section-header"><div className="section-title">Recent Cases</div><button className="btn btn-ghost btn-sm" onClick={()=>router.push('/cases')}>View All</button></div>
          {loading?<div style={{textAlign:'center',padding:'30px',color:'var(--text3)'}}><span className="spinning">⟳</span></div>:(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {cases.slice(0,5).map(c=>(
                <div key={c.id} onClick={()=>router.push(`/cases/${c.id}`)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:'var(--radius)',background:'var(--bg3)',cursor:'pointer',borderLeft:`3px solid ${PRIORITY_COLOR[c.priority]||'var(--gray)'}`,transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg4)'} onMouseLeave={e=>e.currentTarget.style.background='var(--bg3)'}>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13,marginBottom:3}} className="truncate">{c.title}</div><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="font-mono" style={{fontSize:10,color:'var(--text3)'}}>{c.id.toUpperCase()}</span><span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span></div></div>
                  <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:12,fontWeight:600,color:'var(--red)'}}>{fmt(c.victim?.lossAmount||0)}</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--font-mono)'}}>{c.lastUpdated}</div></div>
                </div>
              ))}
              {cases.length===0&&!loading&&<div className="empty"><div className="empty-icon">📁</div><div className="empty-text">No cases yet.</div></div>}
            </div>
          )}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div className="card">
            <div className="section-title" style={{marginBottom:12}}>Attack Types</div>
            {Object.entries(byType).map(([type,count])=>(
              <div key={type} style={{marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{color:'var(--text2)'}}>{type}</span><span className="font-mono" style={{color:'var(--accent)'}}>{count}</span></div><div style={{background:'var(--bg3)',borderRadius:99,height:5}}><div style={{background:'var(--accent)',borderRadius:99,height:5,width:`${(count/Math.max(cases.length,1))*100}%`,transition:'width 0.4s'}}/></div></div>
            ))}
            {Object.keys(byType).length===0&&<div style={{color:'var(--text3)',fontSize:12}}>No data yet</div>}
          </div>
          <div className="card">
            <div className="section-title" style={{marginBottom:10}}>Quick Actions</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button className="btn btn-primary w-full" onClick={()=>router.push('/cases/new')}>+ Create New Case</button>
              <button className="btn btn-secondary w-full" onClick={()=>router.push('/cases')}>📁 Browse All Cases</button>
              <button className="btn btn-secondary w-full" onClick={()=>router.push('/training')}>🎓 Training Module</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
