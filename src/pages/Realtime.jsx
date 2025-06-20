import React, { useState } from 'react';
import { eventTypes }    from '../data/eventTypes';
import { pageLocations } from '../data/pageLocations';
import { eventParams }   from '../data/eventParams';
import { userParams }    from '../data/userParams';
import { itemParams }    from '../data/itemParams';
import './Realtime.css';

export default function Realtime() {
  const [searchUrl, setSearchUrl] = useState('');
  const filteredPages = pageLocations.filter(p =>
    p.url.toLowerCase().includes(searchUrl.toLowerCase())
  );

  return (
    <>
      {/* === 1. Métriques principales en mode clair === */}
      <div className="main-metrics-light">
        <div className="main-metric-card">
          <div className="main-metric-label">Number of Hits</div>
          <div className="main-metric-value">549 336</div>
        </div>
      </div>

      {/* === 2. Disque & métriques dans container fixe (mode sombre uniquement) === */}
      <div className="overview-container">
        <div className="disk-wrapper">
          <div className="pie-wrapper">
            <div className="status-ring"></div>
          </div>
          <div className="metric-center">
            <div className="metric-label">Number of Hits</div>
            <div className="metric-value">549 336</div>
          </div>
        </div>
        <div className="metrics-around">
          <div className="metric-card top">
            <div className="metric-value-small">100%</div>
            <div className="metric-desc">Error Rate</div>
          </div>
          <div className="metric-card left">
            <div className="metric-value-small">7</div>
            <div className="metric-desc">Events</div>
          </div>
          <div className="metric-card right">
            <div className="metric-value-small">0</div>
            <div className="metric-desc">Good Hits</div>
          </div>
          <div className="metric-card bottom">
            <div className="metric-value-small">1</div>
            <div className="metric-desc">User Params</div>
          </div>
        </div>
      </div>

      {/* === 3. Tableaux en pleine largeur === */}
      <div className="tables-wrapper">
        <section className="tracker-check">
          <h2>Event Tracking Checking</h2>
          <p>Performance des événements par type</p>
          <div className="pill">{eventTypes.length} événements</div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Hits</th>
                  <th>%Error</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {eventTypes.map(e => (
                  <tr key={e.id}>
                    <td>{e.event}</td>
                    <td>{e.hits.toLocaleString()}</td>
                    <td>{e.errorRate}</td>
                    <td>{e.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tracker-check">
          <h2>Page Location</h2>
          <p>URLs avec le plus d'erreurs</p>
          <input
            type="text"
            placeholder="Rechercher une URL..."
            value={searchUrl}
            onChange={e => setSearchUrl(e.target.value)}
          />
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Page Location</th>
                  <th>%Error</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map(p => (
                  <tr key={p.id}>
                    <td>
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.url}
                      </a>
                    </td>
                    <td>{p.errorRate}</td>
                    <td>{p.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tracker-check">
          <h2>Event Params</h2>
          <p>Paramètres manquants</p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Param</th>
                  <th>%</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {eventParams.map(p => (
                  <tr key={p.id}>
                    <td>{p.param}</td>
                    <td>{p.errorRate}</td>
                    <td>{p.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tracker-check">
          <h2>User Params</h2>
          <p>Paramètres manquants</p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Param</th>
                  <th>%</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {userParams.map(p => (
                  <tr key={p.id}>
                    <td>{p.param}</td>
                    <td>{p.errorRate}</td>
                    <td>{p.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tracker-check">
          <h2>Item Params</h2>
          <p>Paramètres manquants</p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Param</th>
                  <th>%</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {itemParams.map(p => (
                  <tr key={p.id}>
                    <td>{p.param}</td>
                    <td>{p.errorRate}</td>
                    <td>{p.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}