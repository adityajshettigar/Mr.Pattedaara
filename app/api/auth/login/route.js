// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '../../../../lib/db';
import { signToken, makeAuthCookie } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, role, unit, is_active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account deactivated. Contact your Superintendent.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      unit:  user.unit,
    });

    // Log login
    await query(
      'INSERT INTO audit_log (user_id, user_name, action, resource) VALUES ($1,$2,$3,$4)',
      [user.id, user.name, 'LOGIN', 'auth']
    ).catch(() => {});

    const res = NextResponse.json({
      user: { id:user.id, name:user.name, email:user.email, role:user.role, unit:user.unit },
      token,
    });
    res.headers.set('Set-Cookie', makeAuthCookie(token));
    return res;

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
