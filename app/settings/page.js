'use client';
import { useState, useEffect } from 'react';
import { getSettings, saveSettings, initStore } from '../../lib/store';

export default function SettingsPage() {
  const [s,     setS]     = useState({ officer:'', unit:'Cyber Investigation Unit', theme:'dark', apiKeys:{ virustotal:'', shodan:'', hibp:'' } });
  const [saved, setSaved] = useState(false);
  const [show,  setShow]  = useState({ virustotal:false, shodan:false, hibp:false });

  useEffect(() => { initStore(); setS(getSettings()); }, []);

  const set    = (f,v)   => setS(p=>({...p,[f]:v}));
  const setKey = (k,v)   => setS(p=>({...p,apiKeys:{...p.apiKeys,[k]:v}}));
  const toggleShow = (k) => setShow(p=>({...p,[k]:!p[k]}));

  const handleSave = () => {
    saveSettings(s);
    document.documentElement.setAttribute('data-theme', s.theme);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  const API_CONFIGS = [
    { key:'virustotal', name:'VirusTotal', url:'https://www.virustotal.com/gui/my-apikey', tier:'Free (4 req/min)', desc:'URL, domain, IP and file analysis. Used in Forensics tab and graph enrichment.' },
    { key:'shodan',     name:'Shodan',     url:'https://account.shodan.io/',              tier:'Free (limited)',    desc:'IP infrastructure intelligence. Open ports, banners, geolocation.' },
    { key:'hibp',       name:'Have I Been Pwned', url:'https://haveibeenpwned.com/API/Key', tier:'Paid ($3.50/mo)', desc:'Check if email addresses appear in known data breaches.' },
  ];

  return (
    <div className="content animate-in" style={{ maxWidth:600 }}>
      <div className="page-header">
        <div>
          <div className="page-title font-display">Settings</div>
          <div className="page-sub font-mono">Platform configuration</div>
        </div>
      </div>

      {/* Officer Profile */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:16 }}>Officer Profile</div>
        <div className="form-group"><label className="form-label">Officer Name</label><input value={s.officer} onChange={e=>set('officer',e.target.value)} placeholder="Name + Rank" /></div>
        <div className="form-group"><label className="form-label">Unit / Department</label><input value={s.unit} onChange={e=>set('unit',e.target.value)} /></div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:16 }}>Appearance</div>
        <div style={{ display:'flex', gap:10 }}>
          {['dark','light'].map(t=>(
            <button key={t} onClick={()=>{ set('theme',t); document.documentElement.setAttribute('data-theme',t); }}
              style={{ flex:1, padding:'14px', borderRadius:'var(--radius)', cursor:'pointer', border:`2px solid ${s.theme===t?'var(--accent)':'var(--border)'}`, background: s.theme===t?'rgba(245,158,11,0.08)':'var(--bg3)', color: s.theme===t?'var(--accent)':'var(--text2)', fontWeight:600, fontSize:14 }}>
              {t==='dark'?'🌙 Dark':'☀ Light'}
              <div style={{ fontSize:11, fontWeight:400, marginTop:3, fontFamily:'var(--font-mono)' }}>{t==='dark'?'Low eye-strain':'Formal / print'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:6 }}>API Integrations</div>
        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16, lineHeight:1.7 }}>
          These keys enable live intelligence lookups in the Forensics tab and graph enrichment. Keys are stored locally in your browser only — they are never sent to any server except the respective API.
        </div>

        {API_CONFIGS.map(api=>(
          <div key={api.key} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius2)', padding:'14px 16px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{api.name}</div>
                <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>{api.tier}</div>
              </div>
              <a href={api.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'var(--blue)' }}>Get key →</a>
            </div>
            <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10, lineHeight:1.6 }}>{api.desc}</div>
            <div style={{ position:'relative' }}>
              <input
                type={show[api.key]?'text':'password'}
                value={s.apiKeys?.[api.key]||''}
                onChange={e=>setKey(api.key,e.target.value)}
                placeholder={`Paste ${api.name} API key here…`}
                style={{ paddingRight:50 }}
              />
              <button onClick={()=>toggleShow(api.key)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14 }}>
                {show[api.key]?'🙈':'👁'}
              </button>
            </div>
            {s.apiKeys?.[api.key] && <div style={{ marginTop:6, fontSize:12, color:'var(--green)' }}>✓ Key configured</div>}
          </div>
        ))}
      </div>

      {/* About */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title" style={{ marginBottom:10 }}>About</div>
        <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.8 }}>
          <strong style={{ color:'var(--text)', fontFamily:'var(--font-display)', fontSize:16 }}>Mr. Pattedaara — ಪತ್ತೇದಾರ</strong><br/>
          Social Engineering Intelligence Platform<br/>
          <span className="font-mono" style={{ fontSize:12, color:'var(--text3)' }}>Version 2.0 · Phase 1 + Phase 2</span>
        </div>
        <div style={{ marginTop:12, fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)', background:'var(--bg3)', padding:'9px 11px', borderRadius:'var(--radius)', lineHeight:1.8 }}>
          All case data and API keys are stored in browser LocalStorage only.<br/>
          Nothing leaves your device except direct API calls to configured services.
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} style={{ minWidth:150, padding:'11px 24px' }}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
