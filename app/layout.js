'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../lib/authContext';
import '../styles/globals.css';

export const ThemeCtx = createContext({ theme: 'dark', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

function lsGet() { 
  if (typeof window === 'undefined') return { theme: 'dark' };
  try { return JSON.parse(localStorage.getItem('pttdr_settings') || '{"theme":"dark"}'); } catch { return { theme: 'dark' }; } 
}
function lsSet(s) { localStorage.setItem('pttdr_settings', JSON.stringify(s)); }

const ROLE_LABELS = { superintendent: 'Superintendent', investigating_officer: 'Investigating Officer', analyst: 'Analyst', viewer: 'Viewer' };
const ROLE_BADGE = { superintendent: 'var(--accent)', investigating_officer: 'var(--blue)', analyst: 'var(--purple)', viewer: 'var(--gray)' };

function Sidebar() {
  const router = useRouter();
  const path = usePathname();
  const { user, logout } = useAuth(); 

  const nav = [
    { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
    { icon: '📁', label: 'Cases', path: '/cases' },
    { icon: '🎓', label: 'Training', path: '/training' },
    { icon: '⚙', label: 'Settings', path: '/settings' },
  ];
  
  if (user?.role === 'superintendent') {
    nav.splice(3, 0, { icon: '👥', label: 'Users', path: '/users' });
  }

  return (
    <aside className="sidebar">
      <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo.png" alt="logo" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'var(--logo-filter)', flexShrink:0 }} />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Mr. Pattedaara</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>ಪಟ್ಟೆದಾರ</div>
        </div>
      </div>
      <div className="nav-section">
        <div className="nav-label">Navigation</div>
        {nav.map(item => (
          <button key={item.path} className={`nav-item ${path.startsWith(item.path) ? 'active' : ''}`} onClick={() => router.push(item.path)}>
            <span className="icon">{item.icon}</span><span>{item.label}</span>
          </button>
        ))}
      </div>
      {user && (
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: ROLE_BADGE[user.role] || 'var(--text3)' }}>{ROLE_LABELS[user.role] || user.role}</div>
            {user.unit && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{user.unit}</div>}
          </div>
          <button className="btn btn-ghost btn-sm w-full" onClick={logout} style={{ justifyContent: 'center' }}>Sign Out</button>
        </div>
      )}
    </aside>
  );
}

function AppShell({ children }) {
  const { user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter(); 
  
  const isLoginPage = pathname === '/login';

  // 🛡️ The Safety Net: If the backend rejects our token, kick us to login smoothly
  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/login');
    }
  }, [loading, user, isLoginPage, router]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fbbf24', fontFamily: 'monospace' }}>
        SECURE_BOOT_SEQUENCE...
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Prevents the protected UI from flashing while the router redirects us
  if (!user) return null;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={toggle}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </header>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// 🟢 Only ONE RootLayout exported here at the bottom
export default function RootLayout({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const s = lsGet();
    setTheme(s.theme || 'dark');
    document.documentElement.setAttribute('data-theme', s.theme || 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    lsSet({ ...lsGet(), theme: next });
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <title>Mr. Pattedaara — ಪತ್ತೇದಾರ</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <ThemeCtx.Provider value={{ theme, toggle: toggleTheme }}>
            <AppShell>{children}</AppShell>
          </ThemeCtx.Provider>
        </AuthProvider>
      </body>
    </html>
  );
}