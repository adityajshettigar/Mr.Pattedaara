'use client';
import { useState } from 'react';
import { hibpCheckEmail } from '../../lib/apis';

export default function BreachTab({ caseId }) {
  const [email,    setEmail]    = useState('');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [manual,   setManual]   = useState([]);
  const [manForm,  setManForm]  = useState({ source:'', data:'', date:'', notes:'' });

  const runCheck = async () => {
    if (!email.trim()) return alert('Enter an email address');
    setLoading(true); setResult(null);
    const r = await hibpCheckEmail(email.trim());
    setResult(r);
    setLoading(false);
  };

  const addManual = () => {
    if (!manForm.source.trim()) return alert('Source required');
    setManual(p => [...p, { ...manForm, id: Date.now() }]);
    setManForm({ source:'', data:'', date:'', notes:'' });
  };

  return (
    <div style={{ height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0 }}>
        <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>Breach & Threat Intelligence — HIBP auto-lookup + manual log</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
        {/* HIBP Lookup */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Have I Been Pwned — Email Lookup</div>
          <div style={{ display:'flex', gap:10, marginBottom:12 }}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="victim@email.com or suspect@email.com" style={{ flex:1 }} onKeyDown={e=>e.key==='Enter'&&runCheck()} />
            <button className="btn btn-primary" onClick={runCheck} disabled={loading} style={{ flexShrink:0 }}>
              {loading ? '⏳ Checking…' : '🔍 Check Breaches'}
            </button>
          </div>

          {result?.error && <div className="warn-strip">⚠ {result.error}</div>}

          {result && !result.error && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'12px 14px', borderRadius:'var(--radius)', background: result.pwned ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border:`1px solid ${result.pwned?'rgba(239,68,68,0.25)':'rgba(16,185,129,0.25)'}` }}>
                <span style={{ fontSize:22 }}>{result.pwned ? '⚠' : '✓'}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:15, color: result.pwned ? 'var(--red)' : 'var(--green)' }}>
                    {result.pwned ? `Found in ${result.count} data breach${result.count!==1?'es':''}` : 'Not found in known breaches'}
                  </div>
                  <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>{email}</div>
                </div>
              </div>

              {result.breaches?.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {result.breaches.map(b => (
                    <div key={b.name} style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'12px 14px', borderLeft:'3px solid var(--red)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{b.name}</div>
                        <span className="font-mono" style={{ fontSize:11, color:'var(--text3)' }}>{b.date}</span>
                      </div>
                      <div style={{ fontSize:13, color:'var(--text2)', marginBottom:6 }}>{b.domain}</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {(b.dataClasses||[]).map(d=>(
                          <span key={d} style={{ fontSize:11, background:'rgba(239,68,68,0.1)', color:'var(--red)', border:'1px solid rgba(239,68,68,0.25)', padding:'2px 8px', borderRadius:99, fontFamily:'var(--font-mono)' }}>{d}</span>
                        ))}
                      </div>
                      {b.count && <div style={{ fontSize:11, color:'var(--text3)', marginTop:6, fontFamily:'var(--font-mono)' }}>{b.count.toLocaleString()} accounts compromised</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Intelligence Log */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="section-title" style={{ marginBottom:14 }}>Manual Intelligence Log</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div className="form-group" style={{ margin:0 }}><label className="form-label">Source</label><input value={manForm.source} onChange={e=>setManForm(p=>({...p,source:e.target.value}))} placeholder="e.g. Telegram group, dark web, tipoff" /></div>
            <div className="form-group" style={{ margin:0 }}><label className="form-label">Date Found</label><input type="date" value={manForm.date} onChange={e=>setManForm(p=>({...p,date:e.target.value}))} /></div>
          </div>
          <div className="form-group" style={{ margin:0, marginBottom:10 }}><label className="form-label">Data / Indicator</label><input value={manForm.data} onChange={e=>setManForm(p=>({...p,data:e.target.value}))} placeholder="Phone, account, alias, URL…" /></div>
          <div className="form-group" style={{ margin:0, marginBottom:10 }}><label className="form-label">Notes</label><textarea value={manForm.notes} onChange={e=>setManForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Context and how this was discovered" /></div>
          <button className="btn btn-secondary btn-sm" onClick={addManual}>+ Add Entry</button>

          {manual.length > 0 && (
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
              {manual.map(m => (
                <div key={m.id} style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{m.data}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>Source: {m.source} {m.date&&`· ${m.date}`}</div>
                    {m.notes&&<div style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>{m.notes}</div>}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ padding:'2px 7px' }} onClick={()=>setManual(p=>p.filter(x=>x.id!==m.id))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
