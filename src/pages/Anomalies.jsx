import React, { useState } from 'react';
import './Anomalies.css';
import { anomalySummary } from '../data/anomalySummary';
import { anomalyChart } from '../data/anomalyChart';
import { anomalyLog } from '../data/anomalyLog';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Anomalies() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const totalItems = anomalyLog.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = startIdx + perPage;
  const currentLog = anomalyLog.slice(startIdx, endIdx);

  const anomalyScore = ((anomalySummary.detected / anomalySummary.analyzed) * 100).toFixed(1);

  const pieData = [
    { name: 'Normaux', value: anomalySummary.normal },
    { name: 'Anomalies', value: anomalySummary.detected }
  ];

  const COLORS = ['#28a745', '#dc3545'];

  return (
    <div className="anomalies-container">
      <div className="anomaly-header">
        <h1>Score d'Anomalie: {anomalyScore}%</h1>
      </div>

      <div className="summary-cards">
        <div className="card">
          <h3>Événements analysés</h3>
          <p>{anomalySummary.analyzed}</p>
        </div>
        <div className="card">
          <h3>Événements normaux</h3>
          <p>{anomalySummary.normal}</p>
        </div>
        <div className="card">
          <h3>Types d'événements</h3>
          <p>{anomalySummary.eventTypes}</p>
        </div>
      </div>
      <section className="anomaly-log-section">
        <div className="log-header">
          <h2>Journal des Anomalies</h2>
          <p>Analyse détaillée de chaque événement avec scores et classifications</p>
          
          <div className="log-controls">
            <span className="page-info">
              Page {page} sur {totalPages} ({totalItems} événements)
            </span>
            
            <label className="per-page-selector">
              Afficher:
              <select 
                value={perPage} 
                onChange={e => { 
                  setPerPage(+e.target.value); 
                  setPage(1); 
                }}
              >
                {[5, 10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n} par page</option>
                ))}
              </select>
            </label>
            
            <div className="pagination-buttons">
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1}
                className="nav-btn first"
              >
                ⏮ Premier
              </button>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="nav-btn prev"
              >
                ← Précédent
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="nav-btn next"
              >
                Suivant →
              </button>
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page === totalPages}
                className="nav-btn last"
              >
                Dernier ⏭
              </button>
            </div>
          </div>
        </div>
        
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Type d'Événement</th>
                <th>Occurrences</th>
                <th>Score MAD</th>
                <th>Statut</th>
                <th>Informations</th>
              </tr>
            </thead>
            <tbody>
              {currentLog.map((item, index) => (
                <tr key={item.id || index} className={`row-${item.status.toLowerCase()}`}>
                  <td className="date-cell">
                    <div className="date-primary">{item.date}</div>
                    {item.time && <div className="date-secondary">{item.time}</div>}
                  </td>
                  <td className="event-cell">
                    <div className="event-name">{item.event}</div>
                    {item.category && <div className="event-category">{item.category}</div>}
                  </td>
                  <td className="count-cell">
                    <span className="count-value">{item.count.toLocaleString()}</span>
                  </td>
                  <td className="score-cell">
                    <div className="score-container">
                      <span className="score-value">{item.madScore}</span>
                      <div className="score-bar">
                        <div 
                          className="score-fill" 
                          style={{ 
                            width: `${Math.min(parseFloat(item.madScore) * 10, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge status-${item.status.toLowerCase()}`}>
                      {item.status === 'Normal' ? '✓' : '⚠'} {item.status}
                    </span>
                  </td>
                  <td className="info-cell">
                    <div className="info-text">{item.info}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
      </section>

      <section className="anomaly-chart-section">
        <h2>Évolution des événements</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={anomalyChart}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
                contentStyle={{ backgroundColor: 'gray', border: 'none' }}
                cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Bar dataKey="eventCount" fill="#8884d8" name="Événements" />
            <Bar dataKey="anomalyCount" fill="#dc3545" name="Anomalies" />
            </BarChart>

          </ResponsiveContainer>
        </div>

        <h2 style={{ marginTop: "3rem" }}>Répartition des événements</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>




      
    </div>
  );
}
