import React from 'react';
import './Tracking.css';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function Tracking() {
  const fakeData = [
    { date: '01/06', total: 40000, errors: 3000 },
    { date: '02/06', total: 42000, errors: 3200 },
    { date: '03/06', total: 41000, errors: 2000 },
    { date: '04/06', total: 38000, errors: 7000 },
    { date: '05/06', total: 50000, errors: 10000 },
    { date: '06/06', total: 62000, errors: 5000 },
    { date: '07/06', total: 58000, errors: 1000 },
  ];

  const eventsPlan = [
    {
      name: 'page_view', status: '❌', total: '744 682', withErrors: '525 874', errorRate: '70,6%',
      firstError: '19/05/2025', lastError: '16/06/2025'
    },
    {
      name: 'login', status: '❌', total: '577', withErrors: '577', errorRate: '100,0%',
      firstError: '07/06/2025', lastError: '16/06/2025'
    },
    {
      name: 'begin_checkout', status: '❌', total: '5 200', withErrors: '5 200', errorRate: '100,0%',
      firstError: '19/05/2025', lastError: '16/06/2025'
    },
    {
      name: 'purchase', status: '❌', total: '33 245', withErrors: '33 245', errorRate: '100,0%',
      firstError: '19/05/2025', lastError: '16/06/2025'
    },
    {
      name: 'view_item', status: '❌', total: '256 974', withErrors: '131 794', errorRate: '51,3%',
      firstError: '19/05/2025', lastError: '16/06/2025'
    }
  ];

  const missingParams = [
    {
      timestamp: '16/06 21:59', device: 'mobile', os: 'iOS', browser: 'Safari', session: '-',
      event: 'view_item_list', params: ['page_type_level1', 'page_type_level2']
    },
    {
      timestamp: '16/06 21:59', device: 'mobile', os: 'Android', browser: 'Chrome', session: '798967032.1748352799_1750111089',
      event: 'view_item_list', params: ['page_type_level1', 'page_type_level2']
    },
    {
      timestamp: '16/06 21:59', device: 'mobile', os: 'iOS', browser: 'Safari (in-app)', session: '-',
      event: 'view_item_list', params: ['page_type_level1', 'page_type_level2']
    }
  ];

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <h1>Events Tracking Plan</h1>
        <p>Statut des événements attendus</p>
      </div>

      <section className="chart-section">
        <h2 className="chart-title">Total des événements et pourcentage d'erreurs</h2>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={fakeData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#ccc" />
              <YAxis yAxisId="left" stroke="#ccc" />
              <YAxis yAxisId="right" orientation="right" stroke="#ff85c1" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="total" fill="#8884d8" name="Total events" />
              <Line yAxisId="right" type="monotone" dataKey="errors" stroke="#ff85c1" strokeWidth={2} name="% Events With Errors" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>Events Tracking Plan</h2>
          <p>Statut des événements attendus</p>
          <button className="count-pill">7 événements</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Status</th>
                <th>Total Events</th>
                <th>Events with Errors</th>
                <th>Error %</th>
                <th>First Date with Errors</th>
                <th>Last Date with Errors</th>
              </tr>
            </thead>
            <tbody>
              {eventsPlan.map((ev, idx) => (
                <tr key={idx}>
                  <td>{ev.name}</td>
                  <td className="status-cell">{ev.status}</td>
                  <td>{ev.total}</td>
                  <td>{ev.withErrors}</td>
                  <td><strong>{ev.errorRate}</strong></td>
                  <td>{ev.firstError}</td>
                  <td>{ev.lastError}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="table-section">
        <div className="table-header">
          <h2>Events With Missing Parameters</h2>
          <p>Détail des événements avec paramètres manquants (erreurs en premier)</p>
          <button className="count-pill">1291570 erreurs au total</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Device Category</th>
                <th>Device OS</th>
                <th>Browser</th>
                <th>Session ID</th>
                <th>Event</th>
                <th>Missing Params</th>
              </tr>
            </thead>
            <tbody>
              {missingParams.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.timestamp}</td>
                  <td>{e.device}</td>
                  <td>{e.os}</td>
                  <td>{e.browser}</td>
                  <td>{e.session}</td>
                  <td>{e.event}</td>
                  <td>
                    {e.params.map((p, i) => (
                      <span key={i} className="param-badge">{p}</span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
