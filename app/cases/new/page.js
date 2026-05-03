'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { casesApi } from '../../../lib/apiClient'; // 🟢 V3 Database API

const CLASSIFICATIONS = ['Phishing','Vishing','Smishing','UPI Fraud','SIM Swap','Romance Scam','Business Email Compromise','Impersonation','Investment Fraud','Tech Support Scam','Other'];
const CHANNELS = ['Phone Call','WhatsApp','SMS','Email','Facebook','Instagram','Telegram','In Person','Other'];

export default function NewCase() {
  const router = useRouter();

  const [form, setForm] = useState({
    title:'', fir:'', classification:'Phishing', subClassification:'',
    priority:'medium', status:'new', district:'', officer:'',
    victim: { name:'', age:'', gender:'', phone:'', email:'', address:'', occupation:'', lossAmount:'', bank:'', attackChannel:'WhatsApp', incidentDate:'', complaintDate: new Date().toISOString().split('T')[0] },
    suspect: { name:'Unknown', aliases:'', phones:'', emails:'', bankAccounts:'', location:'' },
    notes:'', tags:'',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setV = (field, val) => setForm(f => ({ ...f, victim: { ...f.victim, [field]: val } }));
  const setS = (field, val) => setForm(f => ({ ...f, suspect: { ...f.suspect, [field]: val } }));

  const submit = async () => {
    if (!form.title.trim()) return alert('Case title is required.');
    if (!form.victim.name.trim()) return alert('Victim name is required.');
    
    try {
      // 🟢 The backend handles ID generation and timestamps now!
      const newCase = await casesApi.create({
        ...form,
        victim: { ...form.victim, age: form.victim.age ? parseInt(form.victim.age) : null, lossAmount: form.victim.lossAmount ? parseFloat(form.victim.lossAmount) : 0 },
        suspect: { 
            ...form.suspect, 
            aliases: form.suspect.aliases.split(',').map(s=>s.trim()).filter(Boolean), 
            phones: form.suspect.phones.split(',').map(s=>s.trim()).filter(Boolean), 
            emails: form.suspect.emails.split(',').map(s=>s.trim()).filter(Boolean), 
            bankAccounts: form.suspect.bankAccounts.split(',').map(s=>s.trim()).filter(Boolean) 
        },
        tags: form.tags.split(',').map(s=>s.trim()).filter(Boolean)
      });
      
      router.push(`/cases/${newCase.id}`);
    } catch (err) {
      alert("Failed to create case: " + err.message);
    }
  };

  return (
    <div className="content animate-in" style={{ maxWidth:760 }}>
      <div className="page-header">
        <div>
          <div className="page-title font-display">New Case</div>
          <div className="page-sub font-mono">Register a social engineering complaint</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Create Case →</button>
        </div>
      </div>

      {/* Case Identity */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:14 }}>Case Identity</div>
        <div className="form-group"><label className="form-label">Case Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. UPI Fraud — Vijayawada Victim" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">FIR Number</label><input value={form.fir} onChange={e=>set('fir',e.target.value)} placeholder="FIR/VJW/2026/XXXX" /></div>
          <div className="form-group"><label className="form-label">District</label><input value={form.district} onChange={e=>set('district',e.target.value)} placeholder="e.g. Vijayawada" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Classification</label>
            <select value={form.classification} onChange={e=>set('classification',e.target.value)}>
              {CLASSIFICATIONS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Sub-Classification</label><input value={form.subClassification} onChange={e=>set('subClassification',e.target.value)} placeholder="e.g. OTP Phishing" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Priority</label>
            <select value={form.priority} onChange={e=>set('priority',e.target.value)}>
              <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Investigating Officer</label><input value={form.officer} onChange={e=>set('officer',e.target.value)} placeholder="Name + Rank" /></div>
        </div>
        <div className="form-group"><label className="form-label">Tags (comma separated)</label><input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="KBC Scam, OTP, UPI" /></div>
      </div>

      {/* Victim */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:14 }}>Victim Details</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full Name *</label><input value={form.victim.name} onChange={e=>setV('name',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Occupation</label><input value={form.victim.occupation} onChange={e=>setV('occupation',e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone</label><input value={form.victim.phone} onChange={e=>setV('phone',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Email</label><input value={form.victim.email} onChange={e=>setV('email',e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Address</label><input value={form.victim.address} onChange={e=>setV('address',e.target.value)} /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Financial Loss (₹)</label><input type="number" value={form.victim.lossAmount} onChange={e=>setV('lossAmount',e.target.value)} placeholder="0" /></div>
          <div className="form-group"><label className="form-label">Bank / UPI</label><input value={form.victim.bank} onChange={e=>setV('bank',e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Attack Channel</label>
            <select value={form.victim.attackChannel} onChange={e=>setV('attackChannel',e.target.value)}>
              {CHANNELS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Incident Date</label><input type="date" value={form.victim.incidentDate} onChange={e=>setV('incidentDate',e.target.value)} /></div>
        </div>
      </div>

      {/* Suspect */}
      <div className="card" style={{ marginBottom:14 }}>
        <div className="section-title" style={{ marginBottom:14 }}>Suspect Details (if known)</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Name / Alias Used</label><input value={form.suspect.name} onChange={e=>setS('name',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Known Location</label><input value={form.suspect.location} onChange={e=>setS('location',e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone Numbers (comma sep)</label><input value={form.suspect.phones} onChange={e=>setS('phones',e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Email Addresses (comma sep)</label><input value={form.suspect.emails} onChange={e=>setS('emails',e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Bank Accounts Used (comma sep)</label><input value={form.suspect.bankAccounts} onChange={e=>setS('bankAccounts',e.target.value)} /></div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="section-title" style={{ marginBottom:14 }}>Investigation Notes</div>
        <div className="form-group">
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={5} placeholder="Describe how the attack unfolded, what the victim reported, any initial observations…" />
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>Create Case →</button>
      </div>
    </div>
  );
}