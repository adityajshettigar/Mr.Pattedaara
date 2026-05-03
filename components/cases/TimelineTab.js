'use client';
import { useEffect, useState } from 'react';
import { getTimeline, addTimelineEntry, deleteTimelineEntry } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';

const EVENT_TYPES  = ['attack','financial','investigation','victim-action','other'];
const EVENT_COLORS = { attack:'#ef4444', financial:'#f97316', investigation:'#3b82f6', 'victim-action':'#8b5cf6', other:'#6b7280' };
const MITRE_TAGS   = ['', 'Phishing via Service', 'Spearphishing Attachment', 'Spearphishing Link', 'Pretexting', 'Impersonation', 'Credential Harvesting', 'Money Transfer Fraud', 'SIM Swap'];

export default function TimelineTab({ caseId }) {
  const [entries, setEntries] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], time:'09:00', event:'', detail:'', type:'attack', mitreTag:'' });

  useEffect(() => { setEntries(getTimeline(caseId)); }, [caseId]);

  const set = (f,v) => setForm(p=>({...p,[f]:v}));

  const handleAdd = () => {
    if (!form.event.trim()) return alert('Event description required.');
    const updated = addTimelineEntry(caseId, { ...form, id: uuidv4() });
    setEntries(updated);
    setShowAdd(false);
    setForm({ date: new Date().toISOString().split('T')[0], time:'09:00', event:'', detail:'', type:'attack', mitreTag:'' });
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this entry?')) return;
    const updated = deleteTimelineEntry(caseId, id);
    setEntries(updated);
  };

  return (
    <div style={{ height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Toolbar */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--font-mono)' }}>{entries.length} events recorded</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Event</button>
      </div>

      {/* Timeline */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {entries.length === 0 && (
          <div className="empty"><div className="empty-icon">⏱</div><div className="empty-text">No timeline events yet. Add events to reconstruct the attack chain.</div></div>
        )}

        <div className="timeline">
          {entries.map((e, i) => (
            <div key={e.id} className="tl-item">
              <div className="tl-dot" style={{ background: EVENT_COLORS[e.type] || '#6b7280' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2, flexWrap:'wrap' }}>
                    <span className="font-mono" style={{ fontSize:10, color:'var(--text3)' }}>{e.date} {e.time}</span>
                    <span style={{ fontSize:10, fontWeight:600, color: EVENT_COLORS[e.type], textTransform:'uppercase', letterSpacing:'0.5px' }}>{e.type}</span>
                    {e.mitreTag && <span className="badge badge-purple" style={{ fontSize:9 }}>{e.mitreTag}</span>}
                  </div>
                  <div className="tl-text" style={{ fontWeight:600 }}>{e.event}</div>
                  {e.detail && <div className="tl-note">{e.detail}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft:8, padding:'2px 6px', fontSize:12 }} onClick={() => handleDelete(e.id)}>×</button>
              </div>
              {i < entries.length-1 && <div style={{ height:16 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Timeline Event <button className="modal-close" onClick={() => setShowAdd(false)}>×</button></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date</label><input type="date" value={form.date} onChange={e=>set('date',e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Time</label><input type="time" value={form.time} onChange={e=>set('time',e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Event Description *</label><input value={form.event} onChange={e=>set('event',e.target.value)} placeholder="e.g. Victim received phishing call" /></div>
            <div className="form-group"><label className="form-label">Detail / Evidence</label><textarea value={form.detail} onChange={e=>set('detail',e.target.value)} rows={3} placeholder="Describe what happened in detail…" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Event Type</label>
                <select value={form.type} onChange={e=>set('type',e.target.value)}>
                  {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">MITRE ATT&CK Tag</label>
                <select value={form.mitreTag} onChange={e=>set('mitreTag',e.target.value)}>
                  {MITRE_TAGS.map(t => <option key={t} value={t}>{t || '— None —'}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Add Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
