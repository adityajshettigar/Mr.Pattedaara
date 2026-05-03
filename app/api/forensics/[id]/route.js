// app/api/forensics/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth, ROLES } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function GET(req, { params }) {
  const auth = requireAuth(req, ROLES.VIEWER);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await query(
      'SELECT * FROM forensic_results WHERE case_id=$1 ORDER BY created_at DESC',
      [params.id]
    );
    return NextResponse.json({ forensics: result.rows.map(r => ({ id:r.id, target:r.target, scanType:r.scan_type, results:r.results, timestamp:r.created_at })) });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function POST(req, { params }) {
  const auth = requireAuth(req, ROLES.ANALYST);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    const result = await query(
      'INSERT INTO forensic_results (case_id,target,scan_type,results,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id,created_at',
      [params.id, body.target, body.scanType, JSON.stringify(body.results), auth.user.id]
    );
    return NextResponse.json({ id: result.rows[0].id, timestamp: result.rows[0].created_at }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function DELETE(req, { params }) {
  const auth = requireAuth(req, ROLES.IO);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { searchParams } = new URL(req.url);
    await query('DELETE FROM forensic_results WHERE case_id=$1 AND id=$2', [params.id, searchParams.get('forensicId')]);
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}
