import React, { useState, useEffect } from 'react';
import './Tracking.css';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import DateRangePicker from '../components/ui/DateRangePicker';
import LoadingPage from '../components/ui/LoadingPage';

// Fonction utilitaire pour normaliser un event detail à la structure attendue
function normalizeEventDetail(event) {
  return {
    date: typeof event.date === 'object' && event.date && 'value' in event.date ? String(event.date.value) : (event.date || '-'),
    event_timestamp: typeof event.event_timestamp === 'object' && event.event_timestamp && 'value' in event.event_timestamp ? String(event.event_timestamp.value) : (event.event_timestamp || '-'),
    expected_event_name: event.expected_event_name || '-',
    event_name: event.event_name || '-',
    device_category: event.device_category || '-',
    device_operating_system: event.device_operating_system || '-',
    device_browser: event.device_browser || '-',
    page_location_value: typeof event.page_location_value === 'object' && event.page_location_value && 'value' in event.page_location_value ? String(event.page_location_value.value) : (event.page_location_value || '-'),
    is_event_with_missing_params: event.is_event_with_missing_params || '-',
    missing_event_params: Array.isArray(event.missing_event_params) ? event.missing_event_params.map(x => typeof x === 'object' && x && 'value' in x ? String(x.value) : String(x)) : [],
    missing_user_params: Array.isArray(event.missing_user_params) ? event.missing_user_params.map(x => typeof x === 'object' && x && 'value' in x ? String(x.value) : String(x)) : [],
    missing_item_params: Array.isArray(event.missing_item_params) ? event.missing_item_params.map(x => typeof x === 'object' && x && 'value' in x ? String(x.value) : String(x)) : [],
    missing_ecommerce_params: Array.isArray(event.missing_ecommerce_params) ? event.missing_ecommerce_params.map(x => typeof x === 'object' && x && 'value' in x ? String(x.value) : String(x)) : [],
    all_missing_params: typeof event.all_missing_params === 'object' && event.all_missing_params && 'value' in event.all_missing_params ? String(event.all_missing_params.value) : (event.all_missing_params || '-'),
    session_id: event.session_id || '-',
  };
}

export default function Tracking() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
    label: '30 derniers jours'
  });
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [apiData, setApiData] = useState({ eventsDetail: [], pagination: {}, trackingPlan: [], chartData: [], stats: {} });

  // --- CACHE ---
  function getCacheKey() {
    return JSON.stringify({
      start: dateRange.start,
      end: dateRange.end,
      event: selectedEvent,
      page,
      perPage
    });
  }
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 29);
      setDateRange({
        start: past.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
        label: '30 derniers jours'
      });
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    setLoading(true);
    setError(null);
    if (!window._trackingCache) window._trackingCache = {};
    const cacheKey = getCacheKey();
    if (window._trackingCache[cacheKey]) {
      setApiData(window._trackingCache[cacheKey]);
      setLoading(false);
      // Optionnel : rafraîchir en arrière-plan
      fetchDataAndCache(cacheKey, true);
      return;
    }
    fetchDataAndCache(cacheKey, false);
    function fetchDataAndCache(cacheKey, silent) {
      fetch(`http://localhost:4000/api/tracking?start=${dateRange.start}&end=${dateRange.end}&event=${selectedEvent}&page=${page}&pageSize=${perPage}`)
        .then(res => res.json())
        .then(result => {
          const data = result.data || {};
          const normalizeEvent = (event) => ({
            ...event,
            date: event.date || '-',
            event_timestamp: event.event_timestamp || '-',
            expected_event_name: event.expected_event_name || '-',
            event_name: event.event_name || '-',
            device_category: event.device_category || '-',
            device_operating_system: event.device_operating_system || '-',
            device_browser: event.device_browser || '-',
            session_id: event.session_id || '-',
            missing_event_params: Array.isArray(event.missing_event_params) ? event.missing_event_params : (event.missing_event_params ? [event.missing_event_params] : []),
            missing_item_params: Array.isArray(event.missing_item_params) ? event.missing_item_params : (event.missing_item_params ? [event.missing_item_params] : []),
            missing_user_params: Array.isArray(event.missing_user_params) ? event.missing_user_params : (event.missing_user_params ? [event.missing_user_params] : []),
            missing_ecommerce_params: Array.isArray(event.missing_ecommerce_params) ? event.missing_ecommerce_params : (event.missing_ecommerce_params ? [event.missing_ecommerce_params] : []),
            all_missing_params: event.all_missing_params || '-',
            is_event_with_missing_params: event.is_event_with_missing_params || '-',
            page_location_value: event.page_location_value || '-',
          });
          const apiData = {
            trackingPlan: data.trackingPlan || [],
            chartData: data.chartData || [],
            eventsDetail: Array.isArray(data.eventsDetail) ? data.eventsDetail.map(normalizeEvent) : [],
            stats: data.stats || {},
            pagination: data.pagination || {},
          };
          window._trackingCache[cacheKey] = apiData;
          setApiData(apiData);
          if (!silent) setLoading(false);
        })
        .catch(() => {
          setError("Erreur lors du chargement des données de tracking");
          setLoading(false);
        });
    }
  }, [dateRange, selectedEvent, page, perPage, getCacheKey]);

  // Gestion sécurisée de la pagination
  const isFirstPage = apiData.pagination?.currentPage === 1;
  const isLastPage = apiData.pagination?.currentPage === apiData.pagination?.totalPages;
  const totalPages = apiData.pagination?.totalPages || 1;
  const currentPage = apiData.pagination?.currentPage || 1;

  // Correction : formatage des dates pour l'axe X du graphique (évite [object Object])
  const chartDataWithFormattedDates = (apiData.chartData || []).map(point => {
    let rawDate = point.date;
    if (rawDate && typeof rawDate === 'object') {
      rawDate = rawDate.value || rawDate.date || rawDate.toString();
    }
    // On garde la date au format YYYY-MM-DD pour la logique du chart
    return {
      ...point,
      date: rawDate || '-',
    };
  });

  // Pagination pour Events tracking plan
  const trackingPlanTotalItems = apiData.trackingPlan.length;
  const trackingPlanTotalPages = Math.ceil(trackingPlanTotalItems / perPage);
  const trackingPlanStartIdx = (page - 1) * perPage;
  const trackingPlanEndIdx = trackingPlanStartIdx + perPage;
  const trackingPlanPage = apiData.trackingPlan.slice(trackingPlanStartIdx, trackingPlanEndIdx);

  // Pagination pour Events with missing parameters
  const eventsDetailTotalItems = apiData.pagination?.totalItems || apiData.eventsDetail.length;
  const eventsDetailTotalPages = Math.ceil(eventsDetailTotalItems / perPage);
  const eventsDetailStartIdx = (page - 1) * perPage;
  const eventsDetailEndIdx = eventsDetailStartIdx + perPage;
  const eventsDetailPage = apiData.eventsDetail.slice(eventsDetailStartIdx, eventsDetailEndIdx);

  if (loading) return <LoadingPage />;
  if (error) return <div>{error}</div>;

  return (
    <div className="tracking-container">
      
      <div className="tracking-header">
        <h1>EVENTS TRACKING PLAN</h1>
        <p>Statut des événements attendus</p>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="event-select">Filtrer par événement :</label>
          <select id="event-select" value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); setPage(1); }}>
            <option value="all">Tous les événements</option>
            {availableEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
        </div>
      </div>
      <section className="chart-section" style={{marginTop: '2.5rem', marginBottom: '1.5rem', minHeight: 480}}>
        <h2 className="h2">Total des événements et pourcentage d'erreurs</h2>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8, marginLeft: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, background: '#B5A2D8', borderRadius: 4 }}></div>
            <span style={{ color: '#7F6F9D', fontSize: 13 }}>Total events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, background: '#FFB3D6', borderRadius: 8 }}></div>
            <span style={{ color: '#FFB3D6', fontSize: 13 }}>% Events With Errors</span>
          </div>
        </div>
        <div className="chart-wrapper">
          {(() => {
            // Normalisation des dates au format YYYY-MM-DD
            const normalizeDate = (d) => {
              if (!d) return '';
              if (typeof d === 'string' && d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
              // Essaye de parser d'autres formats
              const dateObj = new Date(d);
              if (!isNaN(dateObj.getTime())) {
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              }
              return String(d);
            };
            // Générer toutes les dates de la période sélectionnée
            if (!dateRange.start || !dateRange.end) return null;
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);
            const allDates = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              allDates.push(d.toISOString().split('T')[0]);
            }
            // Indexer les données existantes par date normalisée
            const dataMap = Object.fromEntries(chartDataWithFormattedDates.map(pt => [normalizeDate(pt.date), pt]));
            // Retourner un tableau complet (zéro si manquant)
            const completedData = allDates.map(date => ({
              date,
              ...dataMap[date],
              total_events: dataMap[date]?.total_events || 0,
              pct_events_with_missing_params: dataMap[date]?.pct_events_with_missing_params || 0
            }));
            // Vérifier s'il y a au moins une vraie donnée
            const hasRealData = completedData.some(pt => pt.total_events > 0 || pt.pct_events_with_missing_params > 0);
            if (!hasRealData) {
              return <div style={{textAlign:'center', color:'#B5A2D8', fontWeight:600, fontSize:18, marginTop:40}}>Aucune donnée pour la période sélectionnée</div>;
            }
            return (
              <div style={{marginTop: '2rem'}}>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={completedData} margin={{ top: 20, right: 30, bottom: 80, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(181,162,216,0.15)" />
                    <XAxis
                      dataKey="date"
                      stroke="#B5A2D8"
                      tick={{fill:'#7F6F9D', fontSize:12, fontFamily:'Inter'}}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={Math.floor((completedData.length || 0) / 8)}
                      tickFormatter={value => {
                        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          const [year, month, day] = value.split('-');
                          return `${day}/${month}`;
                        }
                        return value;
                      }}
                    />
                    <YAxis yAxisId="left" stroke="#B5A2D8" tick={{fill:'#7F6F9D', fontSize:12, fontFamily:'Inter'}} />
                    <YAxis yAxisId="right" orientation="right" stroke="#FFB3D6" tick={{fill:'#FFB3D6', fontSize:12, fontFamily:'Inter'}} domain={[0, 'auto']} />
                    <Tooltip
                      contentStyle={{background:'#fff', border:'1px solid #B5A2D8', color:'#2E1065', fontFamily:'Inter'}}
                      labelFormatter={label => {
                        if (typeof label === 'string' && label.match(/^\d{4}-\d{2}-\d{2}$/)) {
                          const [year, month, day] = label.split('-');
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('fr-FR', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                          });
                        }
                        return label;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="total_events" fill="#B5A2D8" fillOpacity={0.7} name="Total events" />
                    <Line yAxisId="right" type="monotone" dataKey="pct_events_with_missing_params" stroke="#FFB3D6" strokeWidth={2} name="Events With Errors" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      </section>
      <section className="table-section" style={{marginBottom: '1.5rem'}}>
        <div>
          <h2 className="h2" style={{marginBottom: '0.5rem'}}>Events tracking plan</h2>
          <p style={{marginBottom: '0.2rem'}}>Statut des événements attendus</p>
          <button className="count-pill" style={{marginTop: 0, marginBottom: '0.5rem'}}>{apiData.trackingPlan.length} ÉVÉNEMENTS</button>
        </div>
        <div className="table-wrapper" style={{width: '100%', paddingBottom: 8, marginLeft: 0, overflowX: 'unset'}}>
          <table className="table" style={{tableLayout: 'auto', width: '100%'}}>
            <thead>
              <tr>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>EVENT NAME</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>STATUS</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>TOTAL EVENTS</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>EVENTS WITH ERRORS</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>ERROR %</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>FIRST DATE WITH ERRORS</th>
                <th style={{padding: '14px 18px', fontSize: 12, fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', whiteSpace: 'nowrap', width: '90px'}}>LAST DATE WITH ERRORS</th>
              </tr>
            </thead>
            <tbody>
              {apiData.trackingPlan.map((ev, idx) => (
                <tr key={idx} style={{verticalAlign: 'middle'}}>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}>{ev.expected_event_name}</td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}} className="status-cell">{ev.status}</td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}>{ev.total_events}</td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}>{ev.events_with_errors}</td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}><strong>{ev.error_percentage?.toFixed ? ev.error_percentage.toFixed(1) : ev.error_percentage}%</strong></td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}>{ev.first_error_date}</td>
                  <td style={{padding: '12px 18px', fontSize: 12, color: '#2E1065', verticalAlign: 'middle', width: '90px'}}>{ev.last_error_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="table-section" style={{marginBottom: '1.5rem'}}>
        <div>
          <h2 className="h2">Events with missing parameters</h2>
          <p>Détail des événements avec paramètres manquants (erreurs en premier)</p>
          <button className="count-pill">{eventsDetailTotalItems} ERREURS AU TOTAL</button>
        </div>
        <div className="events-detail-table-wrapper table-wrapper" style={{width: '100%', paddingBottom: 8, marginLeft: 0}}>
          <table className="table events-detail-table" style={{borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', tableLayout: 'fixed', minWidth: 0}}>
            <thead>
              <tr>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>TIMESTAMP</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>DEVICE CATEGORY</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>DEVICE OS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>BROWSER</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>SESSION ID</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>EVENT</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>MISSING EVENT PARAMS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>MISSING ITEM PARAMS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>MISSING USER PARAMS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>MISSING E-COMMERCE PARAMS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>STATUS</th>
                <th style={{padding: '16px 10px', fontWeight: 700, color: '#2E1065', textTransform: 'uppercase', wordBreak: 'break-word', textAlign: 'center'}}>URL</th>
              </tr>
            </thead>
            <tbody>
              {eventsDetailPage.map((rawEvent, index) => {
                const event = normalizeEventDetail(rawEvent);
                return (
                  <tr key={`${event.event_timestamp}-${index}`} style={{verticalAlign: 'middle'}}>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.event_timestamp ? new Date(event.event_timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.device_category}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.device_operating_system}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.device_browser}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.session_id}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.event_name}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.missing_event_params.length > 0 ? (
                      <span>
                        {event.missing_event_params.slice(0,2).map((param, i) => (
                          <span key={i} className="param-badge" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>{param}</span>
                        ))}
                        {event.missing_event_params.length > 2 && <span className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>+{event.missing_event_params.length-2}</span>}
                      </span>
                    ) : '-'}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.missing_item_params.length > 0 ? (
                      <span>
                        {event.missing_item_params.slice(0,2).map((param, i) => (
                          <span key={i} className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>{param}</span>
                        ))}
                        {event.missing_item_params.length > 2 && <span className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>+{event.missing_item_params.length-2}</span>}
                      </span>
                    ) : '-'}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.missing_user_params.length > 0 ? (
                      <span>
                        {event.missing_user_params.slice(0,2).map((param, i) => (
                          <span key={i} className="param-badge" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>{param}</span>
                        ))}
                        {event.missing_user_params.length > 2 && <span className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>+{event.missing_user_params.length-2}</span>}
                      </span>
                    ) : '-'}</td>
                    <td style={{padding: '12px 18px', color: '#2E1065', verticalAlign: 'middle'}}>{event.missing_ecommerce_params.length > 0 ? (
                      <span>
                        {event.missing_ecommerce_params.slice(0,2).map((param, i) => (
                          <span key={i} className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>{param}</span>
                        ))}
                        {event.missing_ecommerce_params.length > 2 && <span className="param-badge light" style={{padding: '4px 10px', borderRadius: 8, background: '#ECE6F0', color: '#2E1065', marginRight: 6, fontSize: 13, display: 'inline-block'}}>+{event.missing_ecommerce_params.length-2}</span>}
                      </span>
                    ) : '-'}</td>
                    <td style={{padding: '12px 18px', textAlign: 'center', verticalAlign: 'middle'}}>{event.is_event_with_missing_params === 'true' ? <span style={{color:'#FF3F52',padding: '0 8px'}}>❌</span> : <span style={{color:'#6CD386',padding: '0 8px'}}>✔️</span>}</td>
                    <td style={{padding: '12px 18px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', wordBreak: 'break-all', whiteSpace: 'normal'}} title={event.page_location_value}>{event.page_location_value ? (event.page_location_value.length > 60 ? event.page_location_value.slice(0, 60) + '…' : event.page_location_value) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="log-controls" style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <span className="page-info" style={{ background: '#ECE6F0', color: 'rgba(155,111,157,0.5)', borderRadius: 18, padding: '0.3rem 0.8rem', fontWeight: 700, fontSize: 13, letterSpacing: 0.2, display: 'inline-block', marginRight: '0.5rem' }}>
              Page {page} sur {eventsDetailTotalPages} ({eventsDetailTotalItems} événements)
            </span>
            <label className="per-page-selector" style={{ background: '#ECE6F0', color: 'rgba(210,199,210,0.5)', borderRadius: 18, padding: '0.3rem 0.8rem', fontWeight: 700, fontSize: 13, letterSpacing: 0.2, display: 'inline-block', margin: 0 }}>
              Afficher:
              <select 
                value={perPage} 
                onChange={e => { 
                  setPerPage(+e.target.value); 
                  setPage(1); 
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2E1065',
                  fontWeight: 700,
                  fontSize: 13,
                  outline: 'none',
                  marginLeft: 8,
                  minWidth: 60
                }}
              >
                {[5, 10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n} par page</option>
                ))}
              </select>
            </label>
            <div className="pagination-buttons" style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="anomaly-pager-btn prev" aria-label="Page précédente" style={{ background: '#ECE6F0', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#7F6F9D', fontSize: 18, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 16L8 10L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button onClick={() => setPage(p => Math.min(eventsDetailTotalPages, p + 1))} disabled={page === eventsDetailTotalPages} className="anomaly-pager-btn next" aria-label="Page suivante" style={{ background: '#ECE6F0', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#7F6F9D', fontSize: 18, opacity: page === eventsDetailTotalPages ? 0.5 : 1, cursor: page === eventsDetailTotalPages ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4L12 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
