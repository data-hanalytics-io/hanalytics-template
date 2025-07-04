import React, { useState, useEffect, useContext } from 'react';
import './Anomalies.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import DateRangePicker from '../components/ui/DateRangePicker';
import LoadingPage from '../components/ui/LoadingPage';
import { ThemeContext } from '../theme/ThemeContext';

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mad-accordion">
      <button className="mad-accordion-header" onClick={() => setOpen(o => !o)}>
        <span>{title}</span>
        <span>&#709;</span>
      </button>
      <div className="mad-accordion-panel" >
        {open && <div>{children}</div>}
      </div>
    </div>
  );
}

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
    label: '7 derniers jours'
  });
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [availableEvents, setAvailableEvents] = useState([]);

  // --- CACHE ---
  // function getCacheKey() { ... } // SUPPRIMÉ

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);
      setDateRange({
        start: past.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
        label: '7 derniers jours'
      });
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    if (!window._anomaliesCache) window._anomaliesCache = {};
    const cacheKey = JSON.stringify({
      start: dateRange.start,
      end: dateRange.end
    });
    if (window._anomaliesCache[cacheKey]) {
      setAnomalies(window._anomaliesCache[cacheKey]);
      setLoading(false);
      fetchDataAndCache(cacheKey, true);
      return;
    }
    fetchDataAndCache(cacheKey, false);
    function fetchDataAndCache(cacheKey, silent) {
      fetch(`/api/anomaly?start=${dateRange.start}&end=${dateRange.end}`)
        .then(res => res.json())
        .then(result => {
          const anomalies = result.data || [];
          window._anomaliesCache[cacheKey] = anomalies;
          setAnomalies(anomalies);
          if (!silent) setLoading(false);
          // Extraction des événements uniques pour le sélecteur
          const events = Array.from(new Set((anomalies || []).map(a => a.event_name))).sort();
          setAvailableEvents(events);
        })
        .catch(() => {
          setError("Erreur lors du chargement des anomalies");
          setLoading(false);
        });
    }
  }, [dateRange]);

  if (loading) return <LoadingPage />;
  if (error) return <div>{error}</div>;

  // Mapping pour le résumé et les graphiques
  const totalItems = anomalies.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = startIdx + perPage;
  const currentLog = anomalies.slice(startIdx, endIdx).map(item => ({
    date: item.event_date?.value || item.event_date,
    time: item.analysis_timestamp?.value ? new Date(item.analysis_timestamp.value).toLocaleTimeString() : '',
    event: item.event_name,
    count: Number(item.events_count),
    madScore: item.mad_score ?? 0,
    status: item.anomaly_flag,
    info: item.anomaly_info || '',
    category: '',
    id: item.event_name + '_' + (item.event_date?.value || item.event_date)
  }));

  // Pourcentages pour le pie chart
  const normalCount = anomalies.filter(a => a.anomaly_flag === 'Normal').length;
  const anomalyCount = anomalies.filter(a => a.anomaly_flag !== 'Normal').length;
  const anomalyScore = ((anomalyCount / (anomalyCount + normalCount)) * 100).toFixed(1);
  const pieData = [
    { name: 'Normaux', value: normalCount },
    { name: 'Anomalies', value: anomalyCount }
  ];
  const DONUT_COLORS = ['#7F6F9D', 'rgba(255,63,82,0.3)'];

  // Filtrage par événement
  const filteredAnomalies = selectedEvent === 'all' ? anomalies : anomalies.filter(a => a.event_name === selectedEvent);
  // Graphe évolution (logique Next.js)
  const chartMap = new Map();
  filteredAnomalies.forEach(item => {
    const date = item.event_date?.value || item.event_date;
    if (!chartMap.has(date)) {
      chartMap.set(date, { event_date: date, total_events: 0, anomaly_events: 0 });
    }
    const entry = chartMap.get(date);
    entry.total_events += Number(item.events_count);
    if (item.anomaly_flag !== 'Normal') entry.anomaly_events += Number(item.events_count);
  });
  // Plage complète de dates
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const completeChart = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    completeChart.push(chartMap.get(dateStr) || { event_date: dateStr, total_events: 0, anomaly_events: 0 });
  }

  // Couleurs pour le graphe évolution des événements
  const BAR_COLOR_NORM = '#BDA0C3';
  const BAR_COLOR_ANOM = 'rgba(255,63,82,0.7)';

  return (
    <div className="anomalies-container">
      <div className="anomaly-toolbar">
        <div className="selection-date">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>
      <div className="anomaly-header">
        <h1>Score d'Anomalie: {anomalyScore}%</h1>
      </div>
      <Accordion title="Détection d'anomalies par le score MAD">
        Le score MAD (Médiane des Écarts Absolus) est une méthode statistique robuste pour identifier les anomalies dans les données, calculée en trouvant d'abord la médiane de l'ensemble de données, puis en déterminant la médiane des écarts absolus entre chaque point et cette médiane centrale. Ce qui permet d'utiliser de calculer un score 2 modifié (0,6745 * valeur - médiane / MAD) pour chaque observation, où les valeurs dépassant un seuil prédéfini (généralement 3,0 ou 3,5) sont considérées comme des anomalies; cette approche présente l'avantage majeur d'être moins sensible aux valeurs extrêmes que les méthodes basées sur la moyenne et l'écart-type, le rendant particulièrement efficace pour des distributions non normales ou des ensembles de données contenant déjà des valeurs aberrantes.
      </Accordion>
     
      {/* Bloc résumé + pie chart */}
      <div className="anomaly-metrics-row">
        <div className="summary-cards">
          <div className="card">
            <h3>Événements analysés</h3>
            <p>{anomalies.length}</p>
          </div>
          <div className="card">
            <h3>Événements normaux</h3>
            <p>{normalCount}</p>
          </div>
          <div className="card">
            <h3>Anomalies détectées</h3>
            <p>{anomalyCount}</p>
          </div>
          <div className="card">
            <h3>Types d'événements</h3>
            <p>{availableEvents.length}</p>
          </div>
        </div>
        <div className="anomaly-pie">
          <h2 className="h2">Répartition des événements</h2>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <section className="anomaly-log-section">
        <div className="log-header">
          <h2 className="h2">Journal des anomalies</h2>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="anomaly-pager-btn prev" aria-label="Page précédente">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16L8 10L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="anomaly-pager-btn next" aria-label="Page suivante">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4L12 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
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
                      {item.status}
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
        <div className="chart-header">
          <h2 className="h2">Évolution des événements</h2>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="all">Tous les événements</option>
            {availableEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
        </div>
        <div className="chart-wrapper" style={{ width: '100%', overflowX: 'visible' }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={completeChart} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="event_date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{background: '#1D0A41', color: '#fff', border: '1px solid #B5A2D8', fontWeight: 600, fontSize: 15}} />
              <Legend formatter={(value) => value === 'Événements' || value === 'Normaux' ? <span style={{color: BAR_COLOR_NORM}}>Normaux</span> : <span style={{color: BAR_COLOR_ANOM}}>Anomalies</span>} />
              <Bar dataKey="total_events" fill={BAR_COLOR_NORM} name="Normaux" />
              <Bar dataKey="anomaly_events" fill={BAR_COLOR_ANOM} name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
