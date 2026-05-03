'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { getGraph, addNode, addEdge, deleteNode, deleteEdge, saveGraph } from '../../lib/store';
import { NODE_TYPES, buildCytoscapeStyles, getNodeColor, getNodeIcon } from '../../lib/nodeIcons';
import { vtScanIp, vtScanDomain, vtScanUrl, hibpCheckEmail, shodanLookupIp, whoisLookup } from '../../lib/api';
import { getSettings } from '../../lib/store';
import { v4 as uuidv4 } from 'uuid';

const EDGE_TYPES   = ['owns','contacted','registered','transferred','impersonated','hosted-on','associated-with'];
const CONFIDENCE   = ['confirmed','suspected','unverified'];

function AddNodeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ type:'person', label:'', value:'', confidence:'suspected', notes:'' });
  const set = (f,v) => setForm(p=>({...p,[f]:v}));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Add Entity Node <button className="modal-close" onClick={onClose}>×</button></div>
        <div className="form-group">
          <label className="form-label">Entity Type</label>
          <select value={form.type} onChange={e=>set('type',e.target.value)}>
            {NODE_TYPES.map(t=><option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg3)', borderRadius:'var(--radius)', marginBottom:14 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:getNodeColor(form.type), display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <img src={getNodeIcon(form.type)} width={22} height={22} alt="" />
          </div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>
            {NODE_TYPES.find(t=>t.type===form.type)?.label} node preview
          </div>
        </div>
        <div className="form-group"><label className="form-label">Display Label *</label><input value={form.label} onChange={e=>set('label',e.target.value)} placeholder="e.g. +91-9876543210" /></div>
        <div className="form-group"><label className="form-label">Full Value</label><input value={form.value} onChange={e=>set('value',e.target.value)} placeholder="Full phone, email, IP etc." /></div>
        <div className="form-group">
          <label className="form-label">Confidence</label>
          <select value={form.confidence} onChange={e=>set('confidence',e.target.value)}>
            {CONFIDENCE.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={2} /></div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>{ if(form.label.trim()){onAdd({...form,id:uuidv4()});onClose();}else alert('Label required'); }}>Add Node</button>
        </div>
      </div>
    </div>
  );
}

function AddEdgeModal({ nodes, onClose, onAdd }) {
  const [form, setForm] = useState({ source:nodes[0]?.id||'', target:nodes[1]?.id||nodes[0]?.id||'', label:'', type:'associated-with' });
  const set = (f,v) => setForm(p=>({...p,[f]:v}));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Add Connection <button className="modal-close" onClick={onClose}>×</button></div>
        <div className="form-group"><label className="form-label">From</label>
          <select value={form.source} onChange={e=>set('source',e.target.value)}>
            {nodes.map(n=><option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">To</label>
          <select value={form.target} onChange={e=>set('target',e.target.value)}>
            {nodes.map(n=><option key={n.id} value={n.id}>{n.label} ({n.type})</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Relationship</label>
          <select value={form.type} onChange={e=>set('type',e.target.value)}>
            {EDGE_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Edge Label</label><input value={form.label} onChange={e=>set('label',e.target.value)} placeholder="e.g. called, transferred ₹2L" /></div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>{ if(form.source!==form.target){onAdd({...form,id:uuidv4()});onClose();}else alert('Source and target must differ.'); }}>Add Connection</button>
        </div>
      </div>
    </div>
  );
}

function EnrichPanel({ node, caseId, onClose, onNodesAdded }) {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');

  const enrich = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      let data = {};
      const val = node.value || node.label;
      if (node.type === 'ip')     { const [vt,sh] = await Promise.all([vtScanIp(val), shodanLookupIp(val)]); data = { virustotal:vt, shodan:sh }; }
      if (node.type === 'domain') { const [vt,wh] = await Promise.all([vtScanDomain(val), whoisLookup(val)]); data = { virustotal:vt, whois:wh }; }
      if (node.type === 'email')  { data = { hibp: await hibpCheckEmail(val) }; }
      if (node.type === 'phone')  { data = { info: { note:'Phone enrichment requires manual lookup via TRAI/carrier tools.' } }; }
      if (node.type === 'person') { data = { info: { note:'Person enrichment: use OSINT tools like social media search, LinkedIn, or Pipl manually.' } }; }
      setResult(data);

      // Auto-add child nodes from enrichment
      const g = getGraph(caseId);
      const newNodes = [];
      if (data.shodan && !data.shodan.error) {
        const s = data.shodan;
        if (s.org)  newNodes.push({ type:'org',  label:s.org,  value:s.org,  confidence:'confirmed', notes:'ISP/Org from Shodan' });
        if (s.city && s.country) newNodes.push({ type:'org', label:`${s.city}, ${s.country}`, value:`${s.city}, ${s.country}`, confidence:'confirmed', notes:'Geolocation from Shodan' });
      }
      if (data.whois && !data.whois.error) {
        if (data.whois.registrar) newNodes.push({ type:'org', label:data.whois.registrar, value:data.whois.registrar, confidence:'confirmed', notes:`Domain registrar (reg: ${data.whois.registered})` });
      }
      if (data.hibp && !data.hibp.error && data.hibp.breaches?.length > 0) {
        data.hibp.breaches.slice(0,3).forEach(b => {
          newNodes.push({ type:'org', label:`Breach: ${b.name}`, value:b.domain, confidence:'confirmed', notes:`Data exposed: ${b.dataClasses}. Date: ${b.date}` });
        });
      }
      if (newNodes.length > 0) {
        const cx = (g.nodes.find(n=>n.id===node.id)?.x||300) + 150;
        const cy = g.nodes.find(n=>n.id===node.id)?.y||250;
        newNodes.forEach((n,i) => {
          const nn = { ...n, id:uuidv4(), x:cx+Math.random()*60, y:cy+i*90-newNodes.length*45 };
          addNode(caseId, nn);
          addEdge(caseId, { id:uuidv4(), source:node.id, target:nn.id, label:'enriched', type:'associated-with' });
        });
        onNodesAdded();
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width:580 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-title">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:getNodeColor(node.type),display:'flex',alignItems:'center',justifyContent:'center' }}>
              <img src={getNodeIcon(node.type)} width={20} height={20} alt="" />
            </div>
            Enrich: {node.label}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'10px 13px', marginBottom:16, fontSize:13, color:'var(--text2)' }}>
          <strong style={{ color:'var(--text)' }}>Target:</strong> {node.value||node.label} &nbsp;·&nbsp; <strong style={{ color:'var(--text)' }}>Type:</strong> {node.type}
        </div>

        {!result && !loading && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:14, color:'var(--text2)', marginBottom:16 }}>
              {node.type==='ip'     && 'Will query: VirusTotal + Shodan'}
              {node.type==='domain' && 'Will query: VirusTotal + WHOIS/RDAP'}
              {node.type==='email'  && 'Will query: Have I Been Pwned'}
              {node.type==='phone'  && 'Manual lookup required (see notes)'}
              {node.type==='person' && 'Manual OSINT required (see notes)'}
              {!['ip','domain','email','phone','person'].includes(node.type) && 'No automated enrichment for this node type'}
            </div>
            <button className="btn btn-primary" onClick={enrich}>⚡ Run Enrichment</button>
          </div>
        )}

        {loading && <div style={{ textAlign:'center', padding:'30px', color:'var(--text2)' }}><span className="spinning">⟳</span> &nbsp;Querying intelligence sources…</div>}

        {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius)', padding:'12px', color:'var(--red)', fontSize:13 }}>⚠ {error}</div>}

        {result && !loading && (
          <div>
            {result.virustotal && !result.virustotal.error && (
              <div className="api-card">
                <div className="api-card-title">🛡 VirusTotal</div>
                {result.virustotal.threatScore !== undefined && (
                  <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:28, fontWeight:700, color: result.virustotal.threatScore>50?'var(--red)':result.virustotal.threatScore>20?'var(--accent)':'var(--green)' }}>{result.virustotal.threatScore}%</div>
                      <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>THREAT SCORE</div>
                    </div>
                    <div style={{ flex:1 }}>
                      {['malicious','suspicious','harmless','undetected'].map(k=>result.virustotal[k]!==undefined&&(
                        <div key={k} className="api-result-row"><span className="api-result-label">{k}</span><span className="api-result-val" style={{ color:k==='malicious'?'var(--red)':k==='suspicious'?'var(--accent)':k==='harmless'?'var(--green)':'var(--text2)' }}>{result.virustotal[k]}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {result.virustotal.country && <div className="api-result-row"><span className="api-result-label">country</span><span className="api-result-val">{result.virustotal.country}</span></div>}
                {result.virustotal.asOwner && <div className="api-result-row"><span className="api-result-label">AS owner</span><span className="api-result-val">{result.virustotal.asOwner}</span></div>}
              </div>
            )}
            {result.virustotal?.error && <div style={{ color:'var(--text3)', fontSize:13, padding:'8px', background:'var(--bg3)', borderRadius:'var(--radius)', marginBottom:8 }}>VirusTotal: {result.virustotal.error}</div>}

            {result.shodan && !result.shodan.error && (
              <div className="api-card">
                <div className="api-card-title">🔭 Shodan</div>
                {[['org','Organisation'],['isp','ISP'],['country','Country'],['city','City'],['os','OS']].map(([k,l])=>result.shodan[k]&&result.shodan[k]!=='Unknown'&&<div key={k} className="api-result-row"><span className="api-result-label">{l}</span><span className="api-result-val">{result.shodan[k]}</span></div>)}
                {result.shodan.openPorts?.length>0 && <div className="api-result-row"><span className="api-result-label">Open ports</span><span className="api-result-val">{result.shodan.openPorts.join(', ')}</span></div>}
                {result.shodan.vulns?.length>0 && <div className="api-result-row"><span className="api-result-label">CVEs</span><span className="api-result-val" style={{ color:'var(--red)' }}>{result.shodan.vulns.join(', ')}</span></div>}
              </div>
            )}

            {result.whois && !result.whois.error && (
              <div className="api-card">
                <div className="api-card-title">📋 WHOIS / RDAP</div>
                {[['registered','Registered'],['expires','Expires'],['registrar','Registrar'],['ageLabel','Age']].map(([k,l])=>result.whois[k]&&<div key={k} className="api-result-row"><span className="api-result-label">{l}</span><span className="api-result-val" style={{ color:k==='ageLabel'&&result.whois.ageDays<30?'var(--red)':undefined }}>{result.whois[k]}</span></div>)}
                {result.whois.nameservers?.length>0 && <div className="api-result-row"><span className="api-result-label">Nameservers</span><span className="api-result-val">{result.whois.nameservers.slice(0,2).join(', ')}</span></div>}
              </div>
            )}

            {result.hibp && !result.hibp.error && (
              <div className="api-card">
                <div className="api-card-title" style={{ color: result.hibp.safe?'var(--green)':'var(--red)' }}>
                  {result.hibp.safe ? '✅ Have I Been Pwned — No breaches found' : `⚠ Have I Been Pwned — ${result.hibp.count} breach${result.hibp.count!==1?'es':''} found`}
                </div>
                {result.hibp.breaches?.map(b=>(
                  <div key={b.name} style={{ background:'var(--bg4)', borderRadius:'var(--radius)', padding:'8px 10px', marginBottom:6 }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:3 }}>{b.name} <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>({b.date})</span></div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{b.dataClasses}</div>
                  </div>
                ))}
              </div>
            )}

            {result.info && <div style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'12px', fontSize:13, color:'var(--text2)' }}>{result.info.note}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OsintGraph({ caseId }) {
  const cyRef      = useRef(null);
  const cyInst     = useRef(null);
  const [gData,    setGData]    = useState({ nodes:[], edges:[] });
  const [selected, setSelected] = useState(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [enrichNode,  setEnrichNode]  = useState(null);
  const [layout,   setLayout]   = useState('fcose');
  const theme = getSettings().theme || 'dark';

  const reload = useCallback(() => { const g=getGraph(caseId); setGData(g); return g; }, [caseId]);
  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!cyRef.current || typeof window==='undefined') return;
    let destroyed = false;

    const initCy = async () => {
      const cytoscape = (await import('cytoscape')).default;
      try { const f=(await import('cytoscape-fcose')).default; cytoscape.use(f); } catch {}
      if (destroyed) return;
      if (cyInst.current) { cyInst.current.destroy(); }

      const g = getGraph(caseId);
      const elements = [
        ...g.nodes.map(n => ({ data:{ id:n.id, label:n.label, type:n.type, confidence:n.confidence||'suspected', notes:n.notes, value:n.value }, position: n.x&&n.y?{x:n.x,y:n.y}:undefined })),
        ...g.edges.map(e => ({ data:{ id:e.id, source:e.source, target:e.target, label:e.label||e.type } })),
      ];

      const cy = cytoscape({
        container: cyRef.current,
        elements,
        style: buildCytoscapeStyles(theme),
        layout: g.nodes.some(n=>n.x) ? { name:'preset' } : { name:'fcose', animate:true, padding:50 },
        userZoomingEnabled:  true,
        userPanningEnabled:  true,
        minZoom: 0.2,
        maxZoom: 4,
      });

      cy.on('tap','node', evt => {
        const d=evt.target.data(); setSelected({ kind:'node', ...d, id:evt.target.id() });
      });
      cy.on('tap','edge', evt => {
        const d=evt.target.data(); setSelected({ kind:'edge', ...d, id:evt.target.id() });
      });
      cy.on('tap', evt => { if(evt.target===cy) setSelected(null); });
      cy.on('dragfree','node', () => {
        const g2=getGraph(caseId);
        g2.nodes=g2.nodes.map(n=>{ const p=cy.$id(n.id).position(); return p?{...n,x:Math.round(p.x),y:Math.round(p.y)}:n; });
        saveGraph(caseId,g2);
      });

      cyInst.current = cy;
    };

    initCy();
    return () => { destroyed=true; if(cyInst.current){cyInst.current.destroy();cyInst.current=null;} };
  }, [caseId, theme]);

  const syncCy = (g) => {
    if (!cyInst.current) return;
    g.nodes.forEach(n => {
      if (!cyInst.current.$id(n.id).length) {
        cyInst.current.add({ data:{ id:n.id, label:n.label, type:n.type, confidence:n.confidence||'suspected', notes:n.notes, value:n.value } });
      }
    });
    g.edges.forEach(e => {
      if (!cyInst.current.$id(e.id).length) {
        cyInst.current.add({ data:{ id:e.id, source:e.source, target:e.target, label:e.label||e.type } });
      }
    });
    cyInst.current.style(buildCytoscapeStyles(theme));
  };

  const handleAddNode = (form) => {
    const g = addNode(caseId, form);
    setGData(g); syncCy(g);
    cyInst.current?.layout({ name:'fcose', animate:true, padding:50 }).run();
  };
  const handleAddEdge = (form) => {
    const g = addEdge(caseId, form);
    setGData(g); syncCy(g);
  };
  const handleDeleteSelected = () => {
    if (!selected) return;
    if (selected.kind==='node') {
      if (!confirm(`Delete node "${selected.label}"?`)) return;
      deleteNode(caseId, selected.id);
      cyInst.current?.$id(selected.id).remove();
    } else {
      deleteEdge(caseId, selected.id);
      cyInst.current?.$id(selected.id).remove();
    }
    setSelected(null); reload();
  };

  const reLayout = () => cyInst.current?.layout({ name:layout==='fcose'?'fcose':layout, animate:true, padding:50 }).run();
  const fitGraph = () => cyInst.current?.fit(undefined,50);
  const exportPNG = () => {
    if (!cyInst.current) return;
    const a=document.createElement('a'); a.href=cyInst.current.png({full:true,scale:2}); a.download=`graph-${caseId}.png`; a.click();
  };

  return (
    <div style={{ flex:1, position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', flexShrink:0, flexWrap:'wrap' }}>
        <button className="btn btn-primary btn-sm"   onClick={()=>setShowAddNode(true)}>+ Node</button>
        <button className="btn btn-secondary btn-sm" onClick={()=>setShowAddEdge(true)} disabled={gData.nodes.length<2}>+ Edge</button>
        {selected?.kind==='node' && (
          <button className="btn btn-secondary btn-sm" onClick={()=>setEnrichNode(selected)}>⚡ Enrich</button>
        )}
        {selected && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>🗑 Delete</button>
        )}
        <div style={{ flex:1 }} />
        <select value={layout} onChange={e=>setLayout(e.target.value)} style={{ width:150, padding:'5px 8px', fontSize:12 }}>
          <option value="fcose">Force-directed</option>
          <option value="breadthfirst">Hierarchical</option>
          <option value="circle">Circular</option>
          <option value="grid">Grid</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={reLayout}>⟳ Layout</button>
        <button className="btn btn-ghost btn-sm" onClick={fitGraph}>⊡ Fit</button>
        <button className="btn btn-ghost btn-sm" onClick={exportPNG}>↓ PNG</button>
      </div>

      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <div ref={cyRef} style={{ width:'100%', height:'100%', background:'var(--bg)' }} />

        {/* Legend */}
        <div style={{ position:'absolute', bottom:12, left:12, zIndex:10, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'10px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 18px' }}>
          {NODE_TYPES.map(n => (
  <div key={n.type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text2)' }}>
    <div style={{
      width: 16,
      height: 16,
      // 🟢 FIXED: Use the SVG Data URI instead of a solid background color
      backgroundImage: `url('${getNodeIcon(n.type, n.color)}')`,
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      // Optional: Adds a tiny cyber glow to the legend icons too!
      filter: `drop-shadow(0 0 3px ${n.color}60)` 
    }} />
    {n.label}
  </div>
))}
        </div>

        {/* Selected node panel */}
        {selected && (
          <div style={{ position:'absolute', top:12, right:12, zIndex:10, width:250, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'var(--radius2)', padding:16, boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {selected.kind==='node' && (
                  <div style={{ width:30,height:30,borderRadius:'50%',background:getNodeColor(selected.type),display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <img src={getNodeIcon(selected.type)} width={17} height={17} alt="" />
                  </div>
                )}
                <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700 }}>
                  {selected.kind==='node' ? NODE_TYPES.find(t=>t.type===selected.type)?.label||'Node' : 'Connection'}
                </div>
              </div>
              <button style={{ background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:18 }} onClick={()=>setSelected(null)}>×</button>
            </div>
            {selected.kind==='node' ? (
              <>
                <div style={{ marginBottom:8 }}><div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',marginBottom:2 }}>Label</div><div style={{ fontSize:14,fontWeight:500 }}>{selected.label}</div></div>
                {selected.value && <div style={{ marginBottom:8 }}><div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',marginBottom:2 }}>Value</div><div style={{ fontSize:12,fontFamily:'var(--font-mono)',color:'var(--text2)',wordBreak:'break-all' }}>{selected.value}</div></div>}
                <div style={{ marginBottom:8 }}><div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',marginBottom:2 }}>Confidence</div>
                  <span className={`badge ${selected.confidence==='confirmed'?'badge-green':selected.confidence==='suspected'?'badge-amber':'badge-gray'}`}>{selected.confidence||'suspected'}</span>
                </div>
                {selected.notes && <div style={{ fontSize:12,color:'var(--text2)',lineHeight:1.65,background:'var(--bg3)',borderRadius:'var(--radius)',padding:'8px' }}>{selected.notes}</div>}
                <button className="btn btn-secondary btn-sm w-full" style={{ marginTop:10 }} onClick={()=>setEnrichNode(selected)}>⚡ Enrich this node</button>
              </>
            ) : (
              <>
                <div style={{ marginBottom:6 }}><div style={{ fontSize:11,color:'var(--text3)',fontFamily:'var(--font-mono)',textTransform:'uppercase',marginBottom:2 }}>Relationship</div><div style={{ fontSize:14 }}>{selected.label}</div></div>
                <div style={{ fontSize:12,color:'var(--text3)',fontFamily:'var(--font-mono)' }}>{selected.source} → {selected.target}</div>
              </>
            )}
          </div>
        )}

        {/* Empty state */}
        {gData.nodes.length===0 && (
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none' }}>
            <div style={{ textAlign:'center',color:'var(--text3)' }}>
              <div style={{ fontSize:34,marginBottom:8 }}>🕸</div>
              <div style={{ fontSize:15,marginBottom:4 }}>OSINT Graph is empty</div>
              <div style={{ fontSize:13 }}>Click "+ Node" to start mapping entities</div>
            </div>
          </div>
        )}
      </div>

      {showAddNode && <AddNodeModal onClose={()=>setShowAddNode(false)} onAdd={handleAddNode} />}
      {showAddEdge && <AddEdgeModal nodes={gData.nodes} onClose={()=>setShowAddEdge(false)} onAdd={handleAddEdge} />}
      {enrichNode  && <EnrichPanel node={enrichNode} caseId={caseId} onClose={()=>setEnrichNode(null)} onNodesAdded={()=>{ reload(); if(cyInst.current){ const g=getGraph(caseId); syncCy(g); cyInst.current.layout({name:'fcose',animate:true,padding:50}).run(); }}} />}
    </div>
  );
}
