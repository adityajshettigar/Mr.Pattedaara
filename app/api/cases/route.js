// app/api/cases/route.js
import { NextResponse } from 'next/server';
import { requireAuth, ROLES } from '../../../lib/auth';
import { query } from '../../../lib/db';

function buildCaseId(existingIds) {
  const year = new Date().getFullYear();
  const nums = existingIds.map(id => parseInt(id.split('-')[2]) || 0);
  const next = (Math.max(0, ...nums) + 1).toString().padStart(4, '0');
  return `pttdr-${year}-${next}`;
}

function rowToCase(row) {
  return {
    id:                row.id,
    title:             row.title,
    fir:               row.fir,
    classification:    row.classification,
    subClassification: row.sub_classification,
    priority:          row.priority,
    status:            row.status,
    district:          row.district,
    officer:           row.officer_name,
    officerId:         row.officer_id,
    victim:            row.victim   || {},
    suspect:           row.suspect  || {},
    notes:             row.notes    || '',
    tags:              row.tags     || [],
    evidence:          row.evidence || [],
    dateOpened:        row.date_opened?.toISOString?.()?.split('T')[0] || row.date_opened,
    lastUpdated:       row.last_updated?.toISOString?.()?.split('T')[0] || row.last_updated,
    createdBy:         row.created_by,
  };
}

// GET /api/cases
export async function GET(req) {
  const auth = requireAuth(req, ROLES.VIEWER);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search   = searchParams.get('search');

    let sql    = 'SELECT * FROM cases WHERE 1=1';
    const vals = [];

    // IO can only see their own cases
    if (auth.user.role === ROLES.IO) {
      vals.push(auth.user.id);
      sql += ` AND officer_id = $${vals.length}`;
    }

    if (status)   { vals.push(status);          sql += ` AND status = $${vals.length}`; }
    if (priority) { vals.push(priority);         sql += ` AND priority = $${vals.length}`; }
    if (search)   { vals.push(`%${search}%`);    sql += ` AND (title ILIKE $${vals.length} OR id ILIKE $${vals.length} OR fir ILIKE $${vals.length})`; }

    sql += ' ORDER BY last_updated DESC';

    const result = await query(sql, vals);
    return NextResponse.json({ cases: result.rows.map(rowToCase) });
  } catch (err) {
    console.error('GET /api/cases error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/cases
export async function POST(req) {
  const auth = requireAuth(req, ROLES.IO);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();

    // Generate new case ID
    const existing = await query('SELECT id FROM cases');
    const id = buildCaseId(existing.rows.map(r => r.id));

    const result = await query(`
      INSERT INTO cases (
        id, title, fir, classification, sub_classification,
        priority, status, district, officer_id, officer_name,
        victim, suspect, notes, tags, date_opened, last_updated, created_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
        CURRENT_DATE, CURRENT_DATE, $15
      ) RETURNING *
    `, [
      id,
      body.title,
      body.fir || null,
      body.classification || 'Other',
      body.subClassification || null,
      body.priority || 'medium',
      body.status   || 'new',
      body.district || null,
      auth.user.id,
      body.officer  || auth.user.name,
      JSON.stringify(body.victim  || {}),
      JSON.stringify(body.suspect || {}),
      body.notes || null,
      body.tags  || [],
      auth.user.id,
    ]);

    await query(
      'INSERT INTO audit_log (user_id, user_name, action, resource, details) VALUES ($1,$2,$3,$4,$5)',
      [auth.user.id, auth.user.name, 'CREATE_CASE', id, JSON.stringify({ title: body.title })]
    ).catch(() => {});

    return NextResponse.json({ case: rowToCase(result.rows[0]) }, { status: 201 });
  } catch (err) {
    console.error('POST /api/cases error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
