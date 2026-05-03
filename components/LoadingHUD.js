// components/LoadingHUD.js
export default function LoadingHUD({ message = "SECURE_BOOT_SEQUENCE..." }) {
  return (
    <div style={{ 
      position: 'fixed', inset: 0, zIndex: 9999, 
      background: 'var(--bg)', display: 'flex', 
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
    }}>
      <div className="flex flex-col items-center gap-16">
        {/* Animated Logo */}
        <div className="anim-logo-loading" style={{ width: '100px', height: '100px', marginBottom: '24px' }}>
          <img 
            src="/logo.png" 
            alt="Pattedaara" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'var(--logo-filter)' }} 
          />
        </div>

        {/* HUD Text */}
        <div style={{ textAlign: 'center' }}>
          <div className="hud-boot" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: '12px', letterSpacing: '3px' }}>
            {message}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', marginTop: '12px', color: 'var(--text)' }}>
            Mr. Pattedaara <span style={{ color: 'var(--text3)', fontSize: '18px' }}>v2.0</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '40px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>
        NODE: <span style={{ color: 'var(--blue)' }}></span> | STATUS: <span style={{ color: 'var(--green)' }}>SYSTEM_ONLINE</span>
      </div>
    </div>
  );
}