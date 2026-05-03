// app/api/timeline/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth, ROLES } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function GET(req, { params }) {
  const auth = requireAuth(req, ROLES.VIEWER);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await query(
      'SELECT * FROM timeline_entries WHERE case_id=$1 ORDER BY event_date, event_time',
      [params.id]
    );
    const entries = result.rows.map(r => ({
      id: r.entry_key, date: r.event_date?.toISOString?.()?.split('T')[0] || r.event_date,
      time: r.event_time?.slice?.(0,5) || r.event_time,
      event: r.event, detail: r.detail, type: r.type, mitreTag: r.mitre_tag,
    }));
    return NextResponse.json({ entries });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function POST(req, { params }) {
  const auth = requireAuth(req, ROLES.ANALYST);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    await query(`
      INSERT INTO timeline_entries (case_id,entry_key,event_date,event_time,event,detail,type,mitre_tag)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (case_id,entry_key) DO NOTHING
    `, [params.id, body.id, body.date, body.time||null, body.event, body.detail||null, body.type||'other', body.mitreTag||null]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function DELETE(req, { params }) {
  const auth = requireAuth(req, ROLES.IO);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');
    await query('DELETE FROM timeline_entries WHERE case_id=$1 AND entry_key=$2', [params.id, entryId]);
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}
