import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Overview from './pages/Overview';
import Realtime from './pages/Realtime';
import Anomalies from './pages/Anomalies';
import Tracking from './pages/Tracking';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/realtime" element={<Realtime />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/tracking" element={<Tracking />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}