'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/apiClient';
// 🟢 IMPORT THE GLOBAL HUD COMPONENT
import LoadingHUD from '../../components/LoadingHUD';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault(); 
    setError(''); 
    setLoading(true); 
    
    try { 
      const user = await login(email, password); 
      if (user) {
        // Wait for the cookie to settle
        await new Promise(r => setTimeout(r, 600)); 
        
        // Force a hard navigation so the app completely rehydrates
        window.location.href = '/dashboard';
      }
    } catch (err) { 
      setError(err.message || 'Invalid Session'); 
      setLoading(false); 
    }
  };

  return (
    <>
      {/* 🟢 CALL THE COMPONENT WITH THE LOGIN-SPECIFIC MESSAGE */}
      {loading && <LoadingHUD message="ESTABLISHING_SECURE_SESSION..." />}

      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            {/* Subtle logo animation on the login page itself */}
            <img 
              src="/logo.png" 
              alt="Pattedaara" 
              className={loading ? "anim-logo-loading" : ""}
              style={{ width:80, height:80, objectFit:'contain', filter:'var(--logo-filter)', marginBottom:16 }} 
            />
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, marginBottom:4 }}>Mr. Pattedaara</h1>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--text3)' }}>ಪತ್ತೇದಾರ · Social Engineering Intelligence Platform</p>
          </div>

          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius2)', padding:32, boxShadow:'0 8px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text3)', marginBottom:22, fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.8px' }}>Officer Sign In</div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="officer@unit.gov" required autoComplete="email" />
              </div>
              <div className="form-group" style={{ marginBottom:22 }}>
                <label className="form-label">Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              </div>
              {error && (
                <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'var(--radius)', padding:'10px 13px', fontSize:13, color:'var(--red)', marginBottom:16 }}>⚠ {error}</div>
              )}
              <button type="submit" className="btn btn-primary w-full" style={{ padding:'12px', fontSize:15, fontWeight:600, justifyContent:'center' }} disabled={loading}>
                {loading ? <span className="spinning">⟳</span> : 'Sign In →'}
              </button>
            </form>
          </div>
          <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>Authorised personnel only · All access is logged</div>
        </div>
      </div>
    </>
  );
}