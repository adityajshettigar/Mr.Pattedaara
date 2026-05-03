'use client';

const MODULES = [
  { id:1, title:'UPI & Payment Fraud', level:'Beginner', icon:'💸', duration:'15 min', desc:'How attackers manipulate victims into making UPI transfers. Common scripts used, red flags, and how to advise victims.', tags:['UPI','PhonePe','GPay','OTP'] },
  { id:2, title:'KBC & Lottery Scams', level:'Beginner', icon:'🎰', duration:'10 min', desc:'The anatomy of fake lottery scams targeting rural and elderly populations. Why they work and how to identify the fraud trail.', tags:['Lottery','KBC','Advance Fee'] },
  { id:3, title:'Phishing & Fake Websites', level:'Intermediate', icon:'🎣', duration:'20 min', desc:'How bulk and spear phishing campaigns are constructed. Domain spoofing, lookalike URLs, email header analysis.', tags:['Phishing','DNS','Email Headers'] },
  { id:4, title:'SIM Swap Attacks', level:'Intermediate', icon:'📱', duration:'18 min', desc:'Step-by-step breakdown of SIM swap fraud. How attackers socially engineer telecom operators and banks.', tags:['SIM Swap','Telecom','OTP Bypass'] },
  { id:5, title:'Romance & Matrimony Scams', level:'Intermediate', icon:'💔', duration:'22 min', desc:'Long-con social engineering via matrimonial sites and social media. Profile construction, grooming phases, and financial extraction.', tags:['Romance Scam','Facebook','Matrimony'] },
  { id:6, title:'Business Email Compromise', level:'Advanced', icon:'🏢', duration:'30 min', desc:'CEO fraud, invoice fraud, and wire transfer scams targeting organisations. Attack chain reconstruction and corporate victim profiling.', tags:['BEC','CEO Fraud','Wire Transfer'] },
  { id:7, title:'Investment & Crypto Fraud', level:'Advanced', icon:'📈', duration:'25 min', desc:'Fake trading platforms, pig butchering scams, and crypto exit scams. Technical infrastructure and money mule networks.', tags:['Crypto','Trading','Pig Butchering'] },
  { id:8, title:'OSINT for Investigators', level:'Advanced', icon:'🔍', duration:'40 min', desc:'Open source intelligence gathering techniques for building suspect profiles. Using public data ethically and legally in investigations.', tags:['OSINT','Digital Forensics','Profiling'] },
];

const LEVEL_BADGE = { Beginner:'badge-green', Intermediate:'badge-amber', Advanced:'badge-red' };

export default function TrainingPage() {
  return (
    <div className="content animate-in">
      <div className="page-header">
        <div>
          <div className="page-title font-display">Training Modules</div>
          <div className="page-sub font-mono">Social Engineering Awareness · Investigation Unit</div>
        </div>
      </div>

      <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'var(--radius2)', padding:'14px 16px', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--blue)', marginBottom:4 }}>🎓 About These Modules</div>
        <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>
          Interactive case reconstructions covering every major social engineering attack type seen in Andhra Pradesh. Designed for constables with no technical background through to experienced cyber investigators. Each module includes real attack anatomy, victim psychology, and investigation guidance.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:14 }}>
        {MODULES.map(m => (
          <div key={m.id} className="card" style={{ cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:26 }}>{m.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{m.title}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <span className={`badge ${LEVEL_BADGE[m.level]}`}>{m.level}</span>
                  <span className="badge badge-gray">{m.duration}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.65, marginBottom:10 }}>{m.desc}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {m.tags.map(t => <span key={t} style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)', padding:'2px 7px', borderRadius:99, fontFamily:'var(--font-mono)' }}>{t}</span>)}
            </div>
            <button className="btn btn-secondary btn-sm w-full" style={{ marginTop:12 }}>
              Coming Soon →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
