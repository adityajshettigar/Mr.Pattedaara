'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
// 🟢 V3 Database API Imports
import { casesApi, fetchTimeline, fetchGraph } from '../../../../lib/apiClient';

const fmt = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n||0);

export default function ReportPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [c,  setC]  = useState(null);
  const [tl, setTl] = useState([]);
  const [gr, setGr] = useState({ nodes:[], edges:[] });
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🟢 Asynchronous data fetching from PostgreSQL via apiClient
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const caseData = await casesApi.get(id);
        setC(caseData);
        
        const timelineData = await fetchTimeline(id);
        setTl(timelineData || []);
        
        const graphData = await fetchGraph(id);
        setGr(graphData || { nodes:[], edges:[] });
      } catch (err) {
        console.error("Failed to fetch report data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) loadData();
  }, [id]);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF }      = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc  = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
      const W    = 210;
      const margin = 18;
      let y = margin;

      const accent = [15, 23, 42]; // Deep slate/navy for a more official look
      const dark   = [30, 41, 59];
      const gray   = [100, 116, 139];
      const light  = [241, 245, 249];

      // ── HEADER ───────────────────────────────────────────
      doc.setFillColor(...accent);
      doc.rect(0, 0, W, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('MR. PATTEDAARA', margin, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      // 🟢 FIXED: Removed Kannada text to prevent the 'ÝÍÝÆ' encoding error
      doc.text('SOCIAL ENGINEERING INTELLIGENCE PLATFORM  ·  INVESTIGATION UNIT', margin, 22);

      doc.setDrawColor(245, 158, 11); // Amber line
      doc.setLineWidth(0.8);
      doc.line(margin, 28, W - margin, 28);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('OFFICIAL CASE DOSSIER', margin, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text(new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }).toUpperCase(), W - margin, 36, { align: 'right' });

      y = 48;

      // ── CASE IDENTITY GRID ─────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...dark);
      doc.text(c?.title ? c.title.toUpperCase() : 'UNTITLED CASE', margin, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [],
        body: [
          ['CASE ID', (c?.id || '').toUpperCase(), 'FIR NUMBER', c?.fir || 'N/A'],
          ['STATUS', (c?.status || '').toUpperCase(), 'PRIORITY', (c?.priority || '').toUpperCase()],
          ['DISTRICT', c?.district || 'N/A', 'OFFICER', c?.officer || 'N/A'],
          ['CLASSIFICATION', c?.classification || 'N/A', 'DATE OPENED', c?.dateOpened || 'N/A']
        ],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: dark, lineColor: [203, 213, 225] },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: light, cellWidth: 35 },
          2: { fontStyle: 'bold', fillColor: light, cellWidth: 35 }
        },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── SUBJECT PROFILES ────────────────────────────────────
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['VICTIM PROFILE', 'SUSPECT INTELLIGENCE']],
        body: [[
          `Name: ${c?.victim?.name || 'N/A'}\nPhone: ${c?.victim?.phone || 'N/A'}\nEmail: ${c?.victim?.email || 'N/A'}\nAddress: ${c?.victim?.address || 'N/A'}\n\nAttack Channel: ${c?.victim?.attackChannel || 'N/A'}\nFinancial Loss: ${fmt(c?.victim?.lossAmount)}`,
          `Identity: ${c?.suspect?.name || 'Unknown'}\nAliases: ${(c?.suspect?.aliases || []).join(', ') || 'None'}\nPhones: ${(c?.suspect?.phones || []).join(', ') || 'None'}\nEmails: ${(c?.suspect?.emails || []).join(', ') || 'None'}\nBanks: ${(c?.suspect?.bankAccounts || []).join(', ') || 'None'}\nLocation: ${c?.suspect?.location || 'Unknown'}`
        ]],
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: dark, lineColor: [203, 213, 225] },
        headStyles: { fillColor: dark, textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin }
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── INVESTIGATION NOTES ──────────────────────────────────
      if (c?.notes) {
        autoTable(doc, {
          startY: y,
          theme: 'grid',
          head: [['INVESTIGATION NOTES']],
          body: [[c.notes]],
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: dark, lineColor: [203, 213, 225] },
          headStyles: { fillColor: light, textColor: dark, fontStyle: 'bold' },
          margin: { left: margin, right: margin }
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // ── TIMELINE ──────────────────────────────────────────
      if (tl.length > 0) {
        if (y > 220) { doc.addPage(); y = margin; }
        autoTable(doc, {
          startY: y,
          theme: 'grid',
          head: [['DATE', 'TIME', 'EVENT', 'DETAILS', 'MITRE TAG']],
          body: tl.map(e => [e.date, e.time, e.event, e.detail || '', e.mitreTag || '']),
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: dark, lineColor: [203, 213, 225] },
          headStyles: { fillColor: dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
          margin: { left: margin, right: margin },
          columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 15 }, 4: { cellWidth: 25 } },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // ── OSINT ENTITIES ───────────────────────────────────────
      if (gr.nodes.length > 0) {
        if (y > 220) { doc.addPage(); y = margin; }
        autoTable(doc, {
          startY: y,
          theme: 'grid',
          head: [['ENTITY TYPE', 'IDENTIFIER / LABEL', 'CONFIDENCE', 'NOTES']],
          body: gr.nodes.map(n => [n.type.toUpperCase(), n.label || n.value, n.confidence, n.notes || '']),
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: dark, lineColor: [203, 213, 225] },
          headStyles: { fillColor: dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
          margin: { left: margin, right: margin },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // ── LEGAL PROVISIONS ──────────────────────────────────
      if (y > 230) { doc.addPage(); y = margin; }
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [['RELEVANT STATUTE', 'DESCRIPTION OF OFFENCE']],
        body: [
          ['IT Act 2000 - Sec 66C', 'Identity theft — using another person\'s identity fraudulently'],
          ['IT Act 2000 - Sec 66D', 'Cheating by personation using computer resource'],
          ['BNS 2023 - Sec 318', 'Cheating and dishonestly inducing delivery of property'],
          ['BNS 2023 - Sec 319', 'Cheating by personation'],
        ],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 3, textColor: dark, lineColor: [203, 213, 225] },
        headStyles: { fillColor: light, textColor: dark, fontStyle: 'bold', fontSize: 8 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: margin, right: margin }
      });

      // ── FOOTER ────────────────────────────────────────────
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(margin, 282, W - margin, 282);
        doc.setFont('helvetica', 'bold'); 
        doc.setFontSize(7); 
        doc.setTextColor(...gray);
        doc.text('MR. PATTEDAARA — CONFIDENTIAL LAW ENFORCEMENT RECORD', margin, 287);
        doc.text(`PAGE ${i} OF ${pages}`, W - margin, 287, { align: 'right' });
      }

      doc.save(`Dossier-${(c?.id || 'case').toUpperCase()}.pdf`);
    } catch(err) {
      alert('Error generating PDF: ' + err.message);
    }
    setGenerating(false);
  };

  // 🟢 Show the loading spinner while the database fetches the records
  if (loading) return <div className="content"><div style={{textAlign:'center',padding:'44px',color:'var(--text3)'}}><span className="spinning">⟳</span></div></div>;
  if (!c) return <div className="content"><div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">Case not found.</div></div></div>;

  return (
    <div className="content animate-in" style={{ maxWidth:700 }}>
      <div className="page-header">
        <div>
          <div className="page-title font-display">Report Generator</div>
          <div className="page-sub font-mono">{c.id.toUpperCase()} · {c.title}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="section-title" style={{ marginBottom:14 }}>Report Preview</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            ['Case ID',       c.id.toUpperCase()],
            ['FIR Number',    c.fir || 'N/A'],
            ['Classification',c.classification],
            ['Status',        c.status],
            ['Victim',        c.victim?.name],
            ['Financial Loss',fmt(c.victim?.lossAmount)],
            ['Timeline Events', tl.length + ' events'],
            ['OSINT Nodes',   gr.nodes.length + ' entities mapped'],
          ].map(([label,val]) => (
            <div key={label} style={{ background:'var(--bg3)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-mono)', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:500 }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'var(--radius)', padding:'12px 14px', marginBottom:14 }}>
          <div style={{ fontSize:12, color:'var(--accent)', fontWeight:600, marginBottom:4 }}>📄 Report will include:</div>
          <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8 }}>
            ✓ Case identity & FIR details · ✓ Full victim profile · ✓ Suspect details<br/>
            ✓ Attack chain timeline with MITRE ATT&CK tags · ✓ OSINT entity list<br/>
            ✓ Applicable IT Act / BNS sections · ✓ Investigation Unit header · ✓ Page numbers
          </div>
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={generatePDF}
          disabled={generating}
          style={{ padding:'12px', fontSize:14, fontWeight:600 }}
        >
          {generating ? '⏳ Generating PDF…' : '📄 Download Legal Report (PDF)'}
        </button>
      </div>
    </div>
  );
}