// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function GET(req) {
  const auth = requireAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await query(
      'SELECT id, name, email, role, unit, is_active, created_at FROM users WHERE id = $1',
      [auth.user.id]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
