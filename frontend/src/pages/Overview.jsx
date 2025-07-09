// Overview.jsx
import React, { useState, useEffect, useContext } from 'react';
import './Dashboard.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import DateRangePicker from '../components/ui/DateRangePicker';
import LoadingPage from '../components/ui/LoadingPage';
import { ThemeContext } from '../theme/ThemeContext';

const Overview = () => {
  const { isLight } = useContext(ThemeContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
    label: 'Selection Date'
  });
  const [datesReady, setDatesReady] = useState(false);

  // --- CACHE ---
  // function getCacheKey() { ... } // SUPPRIMÉ

  // Période par défaut (30 derniers jours)
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setDateRange({
        start: past.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
        label: 'Selection Date'
      });
    }
    setDatesReady(true);
  }, [dateRange.start, dateRange.end]);

  // Fetch data
  useEffect(() => {
    if (!datesReady) return;
    setLoading(true);
    if (!window._overviewCache) window._overviewCache = {};
    const cacheKey = JSON.stringify({
      start: dateRange.start,
      end: dateRange.end
    });
    if (window._overviewCache[cacheKey]) {
      setData(window._overviewCache[cacheKey]);
      setLoading(false);
      fetchDataAndCache(cacheKey, true);
      return;
    }
    fetchDataAndCache(cacheKey, false);
    function fetchDataAndCache(cacheKey, silent) {
      fetch(`/api/dashboard?start=${dateRange.start}&end=${dateRange.end}`)
        .then(res => res.json())
        .then(result => {
          window._overviewCache[cacheKey] = result.data;
          setData(result.data);
          if (!silent) setLoading(false);
        })
        .catch(() => {
          setError("Error loading dashboard metrics");
          setLoading(false);
        });
    }
  }, [dateRange, datesReady]);

  if (loading) return <LoadingPage />;
  if (error)   return <div>{error}</div>;
  if (!data)   return <div>No data</div>;

  const overviewData = {
    totalEvents: data.metrics.total_events,
    validEvents: data.metrics.good_events,
    errorEvents: data.metrics.error_events,
    uniqueUsers: data.metrics.unique_users
  };

  // Calcul du taux d'erreur en pourcentage
  const errorRate = overviewData.totalEvents > 0
    ? ((overviewData.errorEvents / overviewData.totalEvents) * 100).toFixed(1)
    : '0.0';

  // Event Tracking
  const eventTracking = (data.eventStats || []).map(ev => ({
    name: ev.event_name,
    total: ev.hits,
    errors: `${Number(ev.error_percentage).toFixed(1)}%`
  }));

  // Parameter Analysis
  const paramAnalysis = (data.parametersAnalysis || []).map(param => ({
    name: param.param_name,
    value: Number(param.missing_percentage).toFixed(1)
  }));
  const barColors = isLight
    ? ['#7F6F9D', '#ACA0C3', '#D5CEE4', '#E4E1EA']
    : ['#BDA0C3', '#ACA0C3', '#7F6F9D', '#675191'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="overview-date">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats */}
      <div className="overview-stats-container">
        <section className="overview-stats">
          {/** Total Events **/}
          <div className="stat-card">
            <h3>Total Events</h3>
            <p>{overviewData.totalEvents.toLocaleString()}</p>
          </div>
          {/** Valid **/}
          <div className="stat-card">
            <h3>Valid Events</h3>
            <p>{overviewData.validEvents.toLocaleString()}</p>
          </div>
          {/** Errors **/}
          <div className="stat-card">
            <h3>Error Events</h3>
            <p>{overviewData.errorEvents.toLocaleString()}</p>
          </div>
          {/** Users **/}
          <div className="stat-card">
            <h3>Unique Users</h3>
            <p>{overviewData.uniqueUsers.toLocaleString()}</p>
          </div>
          {/** Donut **/}
          <div className="stat-card donut-card">
            <h3>Error Rate</h3>
            <p>{errorRate}%</p>
          </div>
        </section>
      </div>

      {/* Event Tracking */}
      <section className="tracking-section">
        <h2 className="h2">Event tracking</h2>
        <table className="overview-event-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Total</th>
              <th>Error %</th>
            </tr>
          </thead>
          <tbody>
            {eventTracking.map((e, i) => (
              <tr key={i}>
                <td>{e.name}</td>
                <td>{Number(e.total).toLocaleString()}</td>
                <td>{e.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Parameter Analysis */}
      <section className="params-section">
        <h2 className="h2">Parameter analysis</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paramAnalysis} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickFormatter={v => `${v}%`} />
              <Tooltip formatter={v => `${v}%`} contentStyle={{background: isLight ? '#fff' : '#4C386F', color: isLight ? '#2E1065' : '#fff', border: isLight ? '1px solid #B5A2D8' : '1px solid #B5A2D8'}} />
              <Bar dataKey="value" radius={[4,4,0,0]}>
                {paramAnalysis.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default Overview;
