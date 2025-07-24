import React from 'react';

export default function HanalyticsSpinner({
  size = 'md',
  showText = true,
  text = 'Loading...',
  className = ''
}) {
  const getSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'md': return 48;
      case 'lg': return 64;
      case 'xl': return 96;
      default: return 48;
    }
  };
  const spinnerSize = getSize();
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: spinnerSize, height: spinnerSize }}>
        {/* Cercle de base */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid #ece6f0',
        }} />
        {/* Gradient rotatif */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          background: 'conic-gradient(from 0deg, transparent, #2E1065, #817EE1, #C079E0, transparent)',
          maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
          WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))',
          animation: 'spin 1.5s linear infinite'
        }} />
        {/* Particules */}
        <div style={{ position: 'absolute', inset: 0, animation: 'spin 2s linear infinite reverse' }}>
          <div style={{ position: 'absolute', width: 8, height: 8, background: '#FF3F52', borderRadius: '50%', top: '10%', left: '50%', transform: 'translateX(-50%)', animation: 'pulse 1s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: 8, height: 8, background: '#817EE1', borderRadius: '50%', top: '50%', right: '10%', transform: 'translateY(-50%)', animation: 'pulse 1s ease-in-out infinite 0.5s' }} />
        </div>
        {/* Effet de pulsation interne */}
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'linear-gradient(135deg, #fbeaff 0%, #ece6f0 100%)', opacity: 0.5, animation: 'pulse 2s ease-in-out infinite' }} />
      </div>
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <p style={{ color: '#7F6F9D', fontFamily: 'Poppins, Arial', fontWeight: 500, fontSize: 18, margin: 0 }}>{text}</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 150, 300].map((delay, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(90deg, #7F6F9D, #C079E0)', opacity: 0.7, animation: `bounce 1.4s ease-in-out infinite`, animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
} 