// lib/auth.js — JWT utilities
import jwt from 'jsonwebtoken';

// 🟢 SYNCED: Use a consistent secret across the system
const SECRET  = process.env.JWT_SECRET || 'pattedaara-dev-secret-change-in-production';
const EXPIRES = '8h'; 

// 🟢 SYNCED: Cookie name must match your middleware and login route
const COOKIE_NAME = 'auth_token';

export const ROLES = {
  SUPERINTENDENT: 'superintendent',
  IO:             'investigating_officer',
  ANALYST:        'analyst',
  VIEWER:         'viewer',
};

export const ROLE_LABELS = {
  superintendent:        'Superintendent',
  investigating_officer: 'Investigating Officer',
  analyst:               'Analyst',
  viewer:                'Viewer',
};

const ROLE_LEVEL = {
  viewer:                1,
  analyst:               2,
  investigating_officer: 3,
  superintendent:        4,
};

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function hasRole(userRole, requiredRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[requiredRole] || 99);
}

// 🟢 FIXED: Extracting the correct cookie name
export function extractToken(req) {
  // 1. Try cookie first
  const cookieHeader = req.headers.get('cookie') || '';
  // regex updated to find auth_token instead of pttdr_token
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match) return match[1];

  // 2. Try Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

export function requireAuth(req, minRole = ROLES.VIEWER) {
  const token = extractToken(req);
  if (!token) return { error: 'SESSION_EXPIRED', status: 401 };

  const user = verifyToken(token);
  if (!user) return { error: 'INVALID_AUTH_TOKEN', status: 401 };

  if (!hasRole(user.role, minRole)) {
    return { error: `INSUFFICIENT_RANK: Requires ${ROLE_LABELS[minRole]}`, status: 403 };
  }

  return { user };
}

// 🟢 FIXED: Cookie string builders updated for auth_token
export function makeAuthCookie(token) {
  const maxAge = 8 * 60 * 60; // 8 hours
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}