import React from 'react';

export default function LoadingPage({
  title = "Chargement...",
  subtitle = "Merci de patienter pendant le chargement des données",
  showProgress = false,
  progress = 0
}) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      color: '#B5A2D8',
      background: '#fff'
    }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 18, animation: 'spin 1.2s linear infinite' }}>
        <circle cx="24" cy="24" r="20" stroke="#B5A2D8" strokeWidth="6" opacity="0.2" />
        <path d="M44 24a20 20 0 1 1-20-20" stroke="#B5A2D8" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 6 }}>{title}</div>
      <div style={{ color: '#7F6F9D', fontSize: 15 }}>{subtitle}</div>
      {showProgress && (
        <div style={{ marginTop: 24, width: 180 }}>
          <div style={{ width: '100%', background: '#ece6f0', borderRadius: 8, height: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #7F6F9D, #817EE1, #C079E0)', borderRadius: 8, width: `${progress}%`, transition: 'width 0.7s' }} />
          </div>
          <p style={{ fontSize: 12, color: '#7F6F9D', opacity: 0.5, marginTop: 12, fontFamily: 'Poppins, Arial' }}>{progress}%</p>
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
} 