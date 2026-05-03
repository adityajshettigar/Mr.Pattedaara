// middleware/withAuth.js — wraps API routes with JWT verification
import { requireAuth } from '../lib/auth';
import { NextResponse } from 'next/server';

export function withAuth(handler, minRole) {
  return async function(req, context) {
    const auth = requireAuth(req, minRole);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    // Attach user to request context
    req.user = auth.user;
    return handler(req, context, auth.user);
  };
}
