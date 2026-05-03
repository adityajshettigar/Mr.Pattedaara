'use client';
import { useEffect, useState } from 'react';
import { getForensics, saveForensic, deleteForensic, getSettings } from '../../lib/store';
import { vtScanUrl, vtScanIp, vtScanDomain, hibpCheckEmail, shodanLookupIp, whoisLookup } from '../../lib/api';

const SCAN_TYPES = [
  { type:'url',    label:'URL / Website', placeholder:'https://suspicious-site.com', hint:'VirusTotal + WHOIS' },
  { type:'domain', label:'Domain',        placeholder:'securebank-portal.in',        hint:'VirusTotal + WHOIS' },
  { type:'ip',     label:'IP Address',    placeholder:'185.220.101.45',              hint:'VirusTotal + Shodan' },
  { type:'email',  label:'Email Address', placeholder:'victim@email.com',            hint:'Have I Been Pwned' },
];

function ResultSection({ title, icon, data, error }) {
  if (error) return (
    <div className="api-card" style={{ borderLeft: '3px solid var(--red)' }}>
      <div className="api-card-title" style={{ color: 'var(--red)', fontFamily: 'var(--font-brand)' }}>
        {icon} {title.toUpperCase()} — SYSTEM ERROR
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
        LOG: {error}
      </div>
    </div>
  );
  
  if (!data) return null;

  return (
    <div className="api-card animate-in" style={{ padding: '0', overflow: 'hidden' }}>
      {/* HUD Header */}
      <div style={{ 
        background: 'var(--bg4)', 
        padding: '10px 16px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="api-card-title" style={{ margin: 0, color: 'var(--accent)', fontFamily: 'var(--font-brand)', fontSize: 12 }}>
          {icon} {title.toUpperCase()} INTEL_REPORT
        </div>
        {data.permalink && (
          <a href={data.permalink} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>
            External Source ↗
          </a>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Threat Score HUD */}
        {data.threatScore !== undefined && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 30, 
            marginBottom: 20, 
            padding: '15px', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '4px',
            border: '1px solid var(--border)' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className={`threat-score ${data.threatScore > 50 ? 'danger' : data.threatScore > 10 ? 'medium' : 'safe'}`} 
                   style={{ fontSize: 48, fontFamily: 'var(--font-impact)', letterSpacing: 2 }}>
                {data.threatScore}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
                RISK_PROBABILITY
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
              {['malicious', 'suspicious', 'harmless', 'undetected'].filter(k => data[k] !== undefined).map(k => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bg4)', paddingBottom: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-mono)',
                    color: k === 'malicious' ? 'var(--red)' : k === 'suspicious' ? 'var(--accent)' : 'var(--text2)' 
                  }}>{data[k]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {Object.entries(data).filter(([k]) => !['threatScore', 'malicious', 'suspicious', 'harmless', 'undetected', 'permalink'].includes(k)).map(([k, v]) => {
            if (!v || (Array.isArray(v) && v.length === 0)) return null;
            return (
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px dotted var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 2 }}>
                  {k.replace(/([A-Z])/g, '_$1').toUpperCase()}
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: k === 'ageLabel' && String(v).includes('new') ? 'var(--red)' : 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  wordBreak: 'break-all'
                }}>
                  {Array.isArray(v) ? v.join(', ') : String(v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BreachSection({ data, error }) {
  if (error) return <div className="api-card"><div className="api-card-title">🔓 Have I Been Pwned</div><div style={{ fontSize:13,color:'var(--text3)' }}>⚠ {error}</div></div>;
  if (!data) return null;
  return (
    <div className="api-card">
      <div className="api-card-title" style={{ color:data.safe?'var(--green)':'var(--red)' }}>
        {data.safe?'✅ No breaches found':`⚠ ${data.count} breach${data.count!==1?'es':''} found`}
      </div>
      {data.breaches?.map(b=>(
        <div key={b.name} style={{ background:'var(--bg4)',borderRadius:'var(--radius)',padding:'10px 12px',marginBottom:8 }}>
          <div style={{ fontWeight:600,fontSize:14,marginBottom:3 }}>{b.name} <span style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)' }}>{b.date}</span></div>
          <div style={{ fontSize:12,color:'var(--accent)',marginBottom:3 }}>{b.dataClasses}</div>
          <div style={{ fontSize:12,color:'var(--text3)' }}>{b.pwnCount} records · {b.domain}</div>
        </div>
      ))}
    </div>
  );
}

export default function ForensicsTab({ caseId }) {
  const [history,  setHistory]  = useState([]);
  const [scanType, setScanType] = useState('url');
  const [target,   setTarget]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState(null);

  useEffect(() => { setHistory(getForensics(caseId)); }, [caseId]);

  // 🟢 FIXED: Check both the UI settings AND the system environment variables
  const keys    = getSettings().apiKeys || {};
  const hasKeys = !!(
    keys.virustotal || process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY || 
    keys.shodan || process.env.NEXT_PUBLIC_SHODAN_API_KEY ||
    keys.hibp || process.env.NEXT_PUBLIC_HIBP_API_KEY
  );

  const runScan = async () => {
    if (!target.trim()) return alert('Enter a target to scan.');
    setLoading(true); setResults(null);
    const out = {};
    try {
      if (scanType==='url')    { out.virustotal=await vtScanUrl(target); out.whois=await whoisLookup(target.replace(/^https?:\/\//,'').split('/')[0]); }
      if (scanType==='domain') { out.virustotal=await vtScanDomain(target); out.whois=await whoisLookup(target); }
      if (scanType==='ip')     { out.virustotal=await vtScanIp(target); out.shodan=await shodanLookupIp(target); }
      if (scanType==='email')  { out.hibp=await hibpCheckEmail(target); }
      setResults(out);
      saveForensic(caseId,{ target,scanType,results:out });
      setHistory(getForensics(caseId));
    } catch(e) { setResults({ _error:e.message }); }
    setLoading(false);
  };

  const typeConf = SCAN_TYPES.find(t=>t.type===scanType);

  return (
    <div style={{ height:'100%',display:'flex',flexDirection:'column',overflow:'hidden' }}>
      <div style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',flexShrink:0 }}>
        {!hasKeys && (
          <div style={{ background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:'var(--radius)',padding:'10px 13px',marginBottom:12,fontSize:13,color:'var(--accent)' }}>
            ⚡ Add API keys in Settings to enable live scanning.
          </div>
        )}
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <select value={scanType} onChange={e=>{setScanType(e.target.value);setTarget('');}} style={{ width:170,flexShrink:0 }}>
            {SCAN_TYPES.map(t=><option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
          <input value={target} onChange={e=>setTarget(e.target.value)} placeholder={typeConf.placeholder} style={{ flex:1 }} onKeyDown={e=>e.key==='Enter'&&runScan()} />
          <button className="btn btn-primary" onClick={runScan} disabled={loading} style={{ flexShrink:0 }}>
            {loading?<span className="spinning">⟳</span>:'🔍 Scan'}
          </button>
        </div>
        <div style={{ fontSize:12,color:'var(--text3)',marginTop:6,fontFamily:'var(--font-mono)' }}>{typeConf.hint} · results saved to case automatically</div>
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'16px' }}>
        {loading && (
          <div style={{ textAlign:'center',padding:'44px 0',color:'var(--text2)' }}>
            <div style={{ fontSize:30,marginBottom:10 }}><span className="spinning">⟳</span></div>
            <div style={{ fontSize:14 }}>Querying intelligence sources…</div>
          </div>
        )}

        {results && !loading && (
          <div style={{ marginBottom:22 }}>
            <div className="section-header" style={{ marginBottom:12 }}>
              <div className="section-title">Scan Result — {target}</div>
            </div>
            {results._error && <div style={{ color:'var(--red)',fontSize:13,padding:'12px',background:'rgba(239,68,68,0.1)',borderRadius:'var(--radius)' }}>Error: {results._error}</div>}
            {results.virustotal && <ResultSection title="VirusTotal" icon="🛡" data={results.virustotal.error?null:results.virustotal} error={results.virustotal.error} />}
            {results.whois      && <ResultSection title="WHOIS / RDAP" icon="📋" data={results.whois.error?null:results.whois} error={results.whois.error} />}
            {results.shodan     && <ResultSection title="Shodan" icon="🔭" data={results.shodan.error?null:results.shodan} error={results.shodan.error} />}
            {results.hibp       && <BreachSection data={results.hibp.error?null:results.hibp} error={results.hibp.error} />}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="section-header"><div className="section-title">Scan History ({history.length})</div></div>
            {history.map(h=>(
              <div key={h.id} style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 13px',marginBottom:8,cursor:'pointer' }}
                onClick={()=>setResults(h.results)}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <div>
                    <span className="badge badge-gray" style={{ marginRight:8 }}>{h.scanType}</span>
                    <span style={{ fontSize:13,fontFamily:'var(--font-mono)',color:'var(--text2)' }}>{h.target}</span>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <span style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)' }}>{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                    <button className="btn btn-ghost btn-sm" onClick={e=>{e.stopPropagation();deleteForensic(caseId,h.id);setHistory(getForensics(caseId));}}>×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!results && history.length===0 && !loading && (
          <div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">No scans yet. Enter a target above to begin.</div></div>
        )}
      </div>
    </div>
  );
}

