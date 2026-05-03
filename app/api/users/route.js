// app/api/users/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth, ROLES } from '../../../lib/auth';
import { query } from '../../../lib/db';

export async function GET(req) {
  const auth = requireAuth(req, ROLES.SUPERINTENDENT);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await query(
      'SELECT id, name, email, role, unit, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json({ users: result.rows });
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status:500 }); }
}

export async function POST(req) {
  const auth = requireAuth(req, ROLES.SUPERINTENDENT);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { name, email, password, role, unit } = await req.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'name, email, password, role are required' }, { status:400 });
    }
    const validRoles = ['superintendent','investigating_officer','analyst','viewer'];
    if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status:400 });

    const hash   = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (name,email,password_hash,role,unit) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role,unit,created_at',
      [name, email.toLowerCase(), hash, role, unit||'Cyber Investigation Unit']
    );

    await query(
      'INSERT INTO audit_log (user_id,user_name,action,resource,details) VALUES ($1,$2,$3,$4,$5)',
      [auth.user.id, auth.user.name, 'CREATE_USER', result.rows[0].id, JSON.stringify({ email, role })]
    ).catch(() => {});

    return NextResponse.json({ user: result.rows[0] }, { status:201 });
  } catch (err) {
    if (err.code === '23505') return NextResponse.json({ error: 'Email already exists' }, { status:409 });
    return NextResponse.json({ error: 'Server error' }, { status:500 });
  }
}
