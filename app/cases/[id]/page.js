'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCase, initStore, saveCase } from '../../../lib/store';
import OsintGraph from '../../../components/graph/OsintGraph';
import TimelineTab from '../../../components/cases/TimelineTab';
import dynamic from 'next/dynamic';

const ForensicsTab = dynamic(() => import('../../../components/cases/ForensicsTab'), { ssr:false });

const STATUS_OPTIONS = ['new','under-investigation','escalated','pending-court','closed'];
const STATUS_LABEL   = {'new':'New','under-investigation':'Under Investigation','escalated':'Escalated','pending-court':'Pending Court','closed':'Closed'};
const STATUS_BADGE   = {'new':'badge-blue','under-investigation':'badge-amber','escalated':'badge-red','pending-court':'badge-purple','closed':'badge-gray'};
const PRIORITY_COLOR = {critical:'#ef4444',high:'#f97316',medium:'#f59e0b',low:'#6b7280'};
const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom:11 }}>
      <div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:14,color:'var(--text)',fontFamily:mono?'var(--font-mono)':'var(--font-body)' }}>{value}</div>
    </div>
  );
}
function Section({ title, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:12,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',fontFamily:'var(--font-mono)',padding:'8px 0',borderBottom:'1px solid var(--border)',marginBottom:11 }}>{title}</div>
      {children}
    </div>
  );
}

export default function CaseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [c,   setC]   = useState(null);
  const [tab, setTab] = useState('graph');

  useEffect(() => { initStore(); setC(getCase(id)); }, [id]);
  if (!c) return <div className="content"><div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">Case not found.</div></div></div>;

  const updateStatus = (status) => { const u=saveCase({...c,status}); setC(u); };

  return (
    <div className="case-detail" style={{ flex:1, overflow:'hidden' }}>
      {/* LEFT — Case Info */}
      <div className="case-left">
        <div className="case-left-inner">
          <button className="btn btn-ghost btn-sm" onClick={()=>router.push('/cases')} style={{ marginBottom:12 }}>← Cases</button>
          <div className="font-mono" style={{ fontSize:12,color:'var(--text3)',marginBottom:4 }}>{c.id.toUpperCase()}</div>
          <div className="font-display" style={{ fontSize:22,fontWeight:700,lineHeight:1.2,marginBottom:10 }}>{c.title}</div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
            <span className={`badge ${STATUS_BADGE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,color:PRIORITY_COLOR[c.priority] }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:PRIORITY_COLOR[c.priority],display:'block' }}/>
              {c.priority.charAt(0).toUpperCase()+c.priority.slice(1)}
            </span>
          </div>
          <select value={c.status} onChange={e=>updateStatus(e.target.value)} style={{ width:'100%',marginBottom:10 }}>
            {STATUS_OPTIONS.map(s=><option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm w-full" onClick={()=>router.push(`/cases/${id}/report`)} style={{ marginBottom:18 }}>📄 Generate Report</button>

          <Section title="Case Details">
            <Field label="FIR Number"           value={c.fir} mono />
            <Field label="Classification"       value={`${c.classification}${c.subClassification?' — '+c.subClassification:''}`} />
            <Field label="District"             value={c.district} />
            <Field label="Investigating Officer" value={c.officer} />
            <Field label="Date Opened"          value={c.dateOpened} mono />
            <Field label="Last Updated"         value={c.lastUpdated} mono />
            {c.tags?.length>0 && <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginTop:4 }}>{c.tags.map(t=><span key={t} className="badge badge-gray">{t}</span>)}</div>}
          </Section>

          <Section title="Victim">
            <Field label="Name"           value={c.victim?.name} />
            <Field label="Phone"          value={c.victim?.phone} mono />
            <Field label="Email"          value={c.victim?.email} mono />
            <Field label="Occupation"     value={c.victim?.occupation} />
            <Field label="Address"        value={c.victim?.address} />
            <Field label="Attack Channel" value={c.victim?.attackChannel} />
            <Field label="Incident Date"  value={c.victim?.incidentDate} mono />
            <div style={{ marginBottom:11 }}>
              <div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:3 }}>Financial Loss</div>
              <div style={{ fontSize:18,fontWeight:700,color:'var(--red)' }}>{fmt(c.victim?.lossAmount)}</div>
            </div>
            <Field label="Bank / UPI" value={c.victim?.bank} />
          </Section>

          <Section title="Suspect">
            <Field label="Identity"      value={c.suspect?.name} />
            {c.suspect?.phones?.length>0     && <Field label="Phone Numbers"  value={c.suspect.phones.join(', ')} mono />}
            {c.suspect?.emails?.length>0     && <Field label="Emails"         value={c.suspect.emails.join(', ')} mono />}
            {c.suspect?.bankAccounts?.length>0 && <Field label="Bank Accounts" value={c.suspect.bankAccounts.join(', ')} mono />}
            <Field label="Location"      value={c.suspect?.location} />
            {c.suspect?.aliases?.length>0    && <Field label="Aliases"         value={c.suspect.aliases.join(', ')} />}
          </Section>

          {c.notes && (
            <Section title="Notes">
              <div style={{ fontSize:14,color:'var(--text2)',lineHeight:1.75,background:'var(--bg3)',borderRadius:'var(--radius)',padding:'11px',borderLeft:'3px solid var(--border2)' }}>{c.notes}</div>
            </Section>
          )}
        </div>
      </div>

      {/* RIGHT — Tabs */}
      <div className="case-right">
        <div className="case-tabs">
          {[['graph','🕸 OSINT Graph'],['timeline','⏱ Timeline'],['forensics','🔍 Forensics'],['report','📄 Report']].map(([key,label])=>(
            <button key={key} className={`case-tab ${tab===key?'active':''}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>
        <div className="case-tab-content">
          {tab==='graph'     && <OsintGraph caseId={id} />}
          {tab==='timeline'  && <TimelineTab caseId={id} />}
          {tab==='forensics' && <ForensicsTab caseId={id} />}
          {tab==='report' && (
            <div className="content" style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%' }}>
              <div className="empty">
                <div className="empty-icon">📄</div>
                <div className="empty-text" style={{ marginBottom:16 }}>Generate a legal-grade PDF report for this case.</div>
                <button className="btn btn-primary" onClick={()=>router.push(`/cases/${id}/report`)}>Open Report Generator →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
