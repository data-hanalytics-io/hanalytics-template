import React, { useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ThemeContext } from '../theme/ThemeContext';

export default function Header() {
  const { isLight, toggleTheme } = useContext(ThemeContext);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const userBtnRef = React.useRef(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0 });

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
  }, [isLight]);

  React.useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('.user-menu-pop')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    if (userBtnRef.current) {
      const rect = userBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.right - 200 });
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header style={{ width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', padding: '0 32px', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 20 }}>
      <div className="logo" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <img 
          src={isLight ? "/assets/logo-light.png" : "/assets/logo.png"} 
          alt="Hanalytics logo" 
          className="logoimg" 
          style={{ height: 28 }}
        />
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/realtime">Realtime</NavLink>
        <NavLink to="/anomalies">Anomalies</NavLink>
        <NavLink to="/tracking">Tracking</NavLink>
        <button
          className="mode-toggle"
          onClick={toggleTheme}
          style={{
            marginLeft: 8,
            border: 'none',
            background: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            height: 40
          }}
          title={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
        >
          <img
            src={isLight ? "/assets/Sun.png" : "/assets/Moon.png"}
            alt={isLight ? "Mode clair" : "Mode sombre"}
            style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
          />
        </button>
        <span style={{ position: 'relative', display: 'inline-block', marginLeft: 16 }}>
          <button
            ref={userBtnRef}
            onClick={() => setUserMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', height: 40 }}
            title="Menu utilisateur"
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="16" fill="#ECE6F0" />
              <ellipse cx="16" cy="13" rx="5" ry="5" fill="#6C4BA6" />
              <ellipse cx="16" cy="23" rx="8" ry="5" fill="#6C4BA6" />
            </svg>
          </button>
          {userMenuOpen && createPortal(
            <div className="user-menu-pop" style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              background: '#F5F5F5',
              border: '1px solid #B5A2D8',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(181,162,216,0.18)',
              minWidth: 200,
              zIndex: 9999,
              padding: '8px 0',
              fontFamily: 'Inter, Arial, sans-serif'
            }}>
              <div style={{
                padding: '14px 28px',
                cursor: 'pointer',
                color: '#6C4BA6',
                fontWeight: 700,
                fontSize: 15,
                borderBottom: '1px solid #ECE6F0',
                background: 'transparent',
                transition: 'background 0.2s',
              }}
                onClick={() => { setUserMenuOpen(false); navigate('/admin'); }}
                onMouseOver={e => e.currentTarget.style.background = '#ECE6F0'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >Administration</div>
              <div style={{
                padding: '14px 28px',
                cursor: 'pointer',
                color: '#FF3F52',
                fontWeight: 700,
                fontSize: 15,
                background: 'transparent',
                transition: 'background 0.2s',
              }}
                onClick={handleLogout}
                onMouseOver={e => e.currentTarget.style.background = '#ECE6F0'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >Disconnect</div>
            </div>, document.body)
          }
        </span>
      </nav>
    </header>
  );
}