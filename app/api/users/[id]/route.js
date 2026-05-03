// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth, ROLES } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function PATCH(req, { params }) {
  const auth = requireAuth(req, ROLES.SUPERINTENDENT);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    const sets = []; const vals = [];
    if (body.role      !== undefined) { vals.push(body.role);       sets.push(`role=$${vals.length}`); }
    if (body.is_active !== undefined) { vals.push(body.is_active);  sets.push(`is_active=$${vals.length}`); }
    if (body.unit      !== undefined) { vals.push(body.unit);       sets.push(`unit=$${vals.length}`); }
    if (body.password  !== undefined) {
      const hash = await bcrypt.hash(body.password, 12);
      vals.push(hash); sets.push(`password_hash=$${vals.length}`);
    }
    if (!sets.length) return NextResponse.json({ error: 'Nothing to update' }, { status:400 });
    sets.push(`updated_at=NOW()`);
    vals.push(params.id);
    const result = await query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING id,name,email,role,unit,is_active`,
      vals
    );
    if (!result.rows.length) return NextResponse.json({ error: 'User not found' }, { status:404 });
    return NextResponse.json({ user: result.rows[0] });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function DELETE(req, { params }) {
  const auth = requireAuth(req, ROLES.SUPERINTENDENT);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.user.id === params.id) return NextResponse.json({ error: 'Cannot delete your own account' }, { status:400 });
  try {
    await query('UPDATE users SET is_active=false WHERE id=$1', [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}
