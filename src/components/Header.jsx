import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

export default function Header() {
  // State pour le mode (garde la préférence en localStorage)
  const [isLight, setIsLight] = React.useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  return (
    <header>
      <div className="logo">
        <img 
          src={isLight ? "/assets/logo-light.png" : "/assets/logo.png"} 
          alt="Hanalytics logo" 
          className="logoimg" 
        />
      </div>
      <nav>
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/realtime">Realtime</NavLink>
        <NavLink to="/anomalies">Anomalies</NavLink>
        <NavLink to="/tracking">Tracking</NavLink>
        <button
          className="mode-toggle"
          onClick={() => setIsLight(l => !l)}
          style={{
            marginLeft: 16,
            border: 'none',
            background: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer'
          }}
          title={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
        >
          {isLight ? '🌞' : '🌙'}
        </button>
      </nav>
    </header>
  );
}