import React, { useState, useEffect } from 'react';
import './Realtime.css';
import LoadingPage from '../components/ui/LoadingPage';
import { ThemeContext } from '../theme/ThemeContext';

export default function Realtime() {
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [searchPage, setSearchPage] = useState('');
  const [showInfo, setShowInfo]     = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null); // Ajout pour l'heure de rafraîchissement
  const { theme } = React.useContext(ThemeContext);

  // --- CACHE ---
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line
  }, []);

  function refreshData() {
    setLoading(true);
    if (!window._realtimeCache) window._realtimeCache = {};
    const cacheKey = 'main';
    if (window._realtimeCache[cacheKey]) {
      setData(window._realtimeCache[cacheKey]);
      setLoading(false);
      fetchDataAndCache(cacheKey, true);
      setLastRefresh(new Date());
      return;
    }
    fetchDataAndCache(cacheKey, false);
    setLastRefresh(new Date());
  }

  function fetchDataAndCache(cacheKey, silent) {
    fetch('/api/realtime')
      .then(res => res.json())
      .then(res => {
        window._realtimeCache[cacheKey] = res.data || {};
        setData(res.data || {});
        if (!silent) setLoading(false);
        setLastRefresh(new Date());
      })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  }

  if (loading) return <LoadingPage />;
  if (error)   return <div>{error}</div>;

  const {
    eventStats = [],
    pageStats  = [],
    eventParams = [],
    userParams  = [],
    itemParams  = []
  } = data;

  const totalHits   = eventStats.reduce((a,e) => a + e.hits, 0);
  const errorHits   = eventStats.reduce((a,e) => a + e.errors, 0);
  const goodHits    = totalHits - errorHits;
  const eventsCount = eventStats.length;
  const userCount   = userParams.length;

  const filteredPages = pageStats.filter(p =>
    (p.page_location_value || '')
      .toLowerCase()
      .includes(searchPage.toLowerCase())
  );

  return (
    <div className="realtime-container">
      {/* HEADER */}
      <div className="realtime-header">
        <button
          className="info-btn"
          onClick={() => setShowInfo(v => !v)}
          title="Comment ça marche"
        >
          🕒
        </button>
        <h1>Realtime</h1>
        <button
          className={`refresh-btn ${theme}`}
          onClick={refreshData}
        >
          Actualiser
        </button>
        {showInfo && (
          <div className="info-popover">
            <div className="popover-header">Comment ça marche</div>
            <ul className="popover-list">
              <li><strong>Avant midi :</strong> données depuis minuit hier.</li>
              <li><strong>Après midi :</strong> données depuis minuit aujourd'hui.</li>
            </ul>
          </div>
        )}
      </div>
      {/* Affichage de la dernière actualisation */}
      <div className={`refresh-info ${theme}`}>
        Dernière actualisation : {lastRefresh ? lastRefresh.toLocaleTimeString() : '...'}
      </div>

      {/* CARTES MÉTRIQUES */}
      <div className="metrics-wrapper">
        <div className="metrics-grid">
          <div className="stat-card">
            <h3>Number of Hits</h3>
            <p>{totalHits.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Error Rate</h3>
            <p>
              { totalHits
                ? ((errorHits/totalHits)*100).toFixed(0) + '%'
                : '0%'
              }
            </p>
          </div>
          <div className="stat-card">
            <h3>Events</h3>
            <p>{eventsCount}</p>
          </div>
          <div className="stat-card">
            <h3>Good Hits</h3>
            <p>{goodHits.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>User Params</h3>
            <p>{userCount}</p>
          </div>
        </div>
      </div>

      {/* TABLEAUX */}
      {/** Event Tracking Checking **/}
      <section className="tracker-section">
        <h2 className="h2">Event tracking checking</h2>
        <p>Performance des événements par type</p>
        <span className="pill">{eventsCount} événements</span>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Hits</th>
                <th>Errors</th>
                <th>%Error</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {eventStats.map((e,i) => (
                <tr key={i}>
                  <td>{e.event_name}</td>
                  <td>{e.hits.toLocaleString()}</td>
                  <td>{e.errors.toLocaleString()}</td>
                  <td>{Number(e.error_percentage).toFixed(1)}%</td>
                  <td>{e.error_percentage===0 ? 'Ok' : 'Attention'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/** Page Location **/}
      <section className="tracker-section">
        <h2>Page location</h2>
        <p>URLs avec le plus d'erreurs</p>
        <input
          type="text"
          placeholder="Rechercher une URL…"
          value={searchPage}
          onChange={e => setSearchPage(e.target.value)}
        />
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Page Location</th>
                <th>%Error</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((p,i) => (
                <tr key={i}>
                  <td className="url-cell">{p.page_location_value}</td>
                  <td>{Number(p.error_percentage).toFixed(1)}%</td>
                  <td>{p.error_percentage===0 ? 'Ok' : 'Attention'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/** Event Params **/}
      <section className="tracker-section">
        <h2>Event params</h2>
        <p>Paramètres manquants</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Param</th>
                <th>%</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {eventParams.map((p,i) => (
                <tr key={i}>
                  <td>{p.param_key}</td>
                  <td>{Number(p.missing_percentage).toFixed(1)}%</td>
                  <td>{p.missing_percentage===0 ? 'Ok' : 'Critical'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/** User Params **/}
      <section className="tracker-section">
        <h2>User params</h2>
        <p>Paramètres manquants</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Param</th>
                <th>%Error</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {userParams.map((p,i) => (
                <tr key={i}>
                  <td>{p.param_key}</td>
                  <td>{Number(p.missing_percentage).toFixed(1)}%</td>
                  <td>{p.missing_percentage===0 ? 'Ok' : 'Critical'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/** Item Params **/}
      <section className="tracker-section">
        <h2>Item params</h2>
        <p>Paramètres manquants</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Param</th>
                <th>%</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {itemParams.map((p,i) => (
                <tr key={i}>
                  <td>{p.param_key}</td>
                  <td>{Number(p.missing_percentage).toFixed(1)}%</td>
                  <td>{p.missing_percentage===0 ? 'Ok' : 'Critical'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
