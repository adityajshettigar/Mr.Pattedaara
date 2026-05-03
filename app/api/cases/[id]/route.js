// app/api/cases/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth, ROLES, hasRole } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

function rowToCase(row) {
  return {
    id: row.id, title: row.title, fir: row.fir,
    classification: row.classification, subClassification: row.sub_classification,
    priority: row.priority, status: row.status, district: row.district,
    officer: row.officer_name, officerId: row.officer_id,
    victim: row.victim || {}, suspect: row.suspect || {},
    notes: row.notes || '', tags: row.tags || [], evidence: row.evidence || [],
    dateOpened:  row.date_opened?.toISOString?.()?.split('T')[0]  || row.date_opened,
    lastUpdated: row.last_updated?.toISOString?.()?.split('T')[0] || row.last_updated,
  };
}

async function canAccess(user, caseRow) {
  if (!caseRow) return false;
  if (hasRole(user.role, ROLES.SUPERINTENDENT)) return true;
  if (hasRole(user.role, 'analyst'))            return true;
  if (user.role === ROLES.IO && caseRow.officer_id === user.id) return true;
  if (user.role === ROLES.VIEWER) return true;
  return false;
}

// GET /api/cases/[id]
export async function GET(req, { params }) {
  const auth = requireAuth(req, ROLES.VIEWER);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await query('SELECT * FROM cases WHERE id = $1', [params.id]);
    if (!result.rows.length) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    const row = result.rows[0];
    if (!await canAccess(auth.user, row)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ case: rowToCase(row) });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/cases/[id]
export async function PATCH(req, { params }) {
  const auth = requireAuth(req, ROLES.ANALYST);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const existing = await query('SELECT * FROM cases WHERE id = $1', [params.id]);
    if (!existing.rows.length) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    if (!await canAccess(auth.user, existing.rows[0])) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Analysts can only update status, not full edit
    const body = await req.json();
    const isAnalyst = auth.user.role === 'analyst';

    if (isAnalyst) {
      // Analysts: status update only
      const result = await query(
        'UPDATE cases SET status=$1, last_updated=CURRENT_DATE WHERE id=$2 RETURNING *',
        [body.status || existing.rows[0].status, params.id]
      );
      return NextResponse.json({ case: rowToCase(result.rows[0]) });
    }

    const result = await query(`
      UPDATE cases SET
        title=$1, fir=$2, classification=$3, sub_classification=$4,
        priority=$5, status=$6, district=$7, officer_name=$8,
        victim=$9, suspect=$10, notes=$11, tags=$12,
        last_updated=CURRENT_DATE
      WHERE id=$13 RETURNING *
    `, [
      body.title             || existing.rows[0].title,
      body.fir               ?? existing.rows[0].fir,
      body.classification    || existing.rows[0].classification,
      body.subClassification ?? existing.rows[0].sub_classification,
      body.priority          || existing.rows[0].priority,
      body.status            || existing.rows[0].status,
      body.district          ?? existing.rows[0].district,
      body.officer           ?? existing.rows[0].officer_name,
      JSON.stringify(body.victim  ?? existing.rows[0].victim),
      JSON.stringify(body.suspect ?? existing.rows[0].suspect),
      body.notes ?? existing.rows[0].notes,
      body.tags  ?? existing.rows[0].tags,
      params.id,
    ]);

    await query(
      'INSERT INTO audit_log (user_id,user_name,action,resource) VALUES ($1,$2,$3,$4)',
      [auth.user.id, auth.user.name, 'UPDATE_CASE', params.id]
    ).catch(() => {});

    return NextResponse.json({ case: rowToCase(result.rows[0]) });
  } catch (err) {
    console.error('PATCH /api/cases/[id] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/cases/[id] — superintendent only
export async function DELETE(req, { params }) {
  const auth = requireAuth(req, ROLES.SUPERINTENDENT);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await query('DELETE FROM cases WHERE id=$1 RETURNING id', [params.id]);
    if (!result.rows.length) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    await query(
      'INSERT INTO audit_log (user_id,user_name,action,resource) VALUES ($1,$2,$3,$4)',
      [auth.user.id, auth.user.name, 'DELETE_CASE', params.id]
    ).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
