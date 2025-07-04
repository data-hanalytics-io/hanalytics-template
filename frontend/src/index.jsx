import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import App from './App';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Realtime from './pages/Realtime.jsx';
import Anomalies from './pages/Anomalies.jsx';
import Tracking from './pages/Tracking.jsx';
import Admin from './pages/Admin.jsx';
import Header from './components/Header';
import { ThemeProvider } from './theme/ThemeContext';

function AuthGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Si pas de token et pas déjà sur /login, on force la connexion
    if (!token && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
    // Si token et on va sur /login, on redirige vers /overview
    if (token && location.pathname === '/login') {
      navigate('/overview', { replace: true });
    }
    // Si on arrive sur /, on redirige selon l'état de connexion
    if (location.pathname === '/') {
      if (token) {
        navigate('/overview', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [location, navigate]);
  return children;
}

function AppContent() {
  const location = useLocation();
  const showHeader = location.pathname !== '/login';
  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Overview />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/realtime" element={<Realtime />} />
        <Route path="/anomalies" element={<Anomalies />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

export default App;