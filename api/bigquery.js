const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}


// Gestion des credentials (local ou production)
function getCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Erreur de parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
      throw new Error('Format JSON des credentials invalide');
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return undefined; // Utilise le chemin du fichier
  }
  throw new Error('Aucun credentials BigQuery trouvé.');
}

const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.NODE_ENV === 'development' ? process.env.GOOGLE_APPLICATION_CREDENTIALS : undefined,
  credentials: process.env.NODE_ENV === 'production' ? getCredentials() : undefined,
});

const dataset = process.env.BIGQUERY_DATASET || 'tracking_health';

async function runQuery(query) {
  try {
    const options = { query, location: 'EU' };
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Erreur BigQuery:', error);
    throw new Error(`Erreur lors de la récupération des données: ${error.message}`);
  }
}

// Exemples de fonctions inspirées du code Next.js
async function getDashboardMetrics(dateRange) {
  const dateFilter = dateRange && dateRange.start && dateRange.end
    ? `WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    : `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        CAST(is_event_with_missing_params AS STRING) as status,
        user_pseudo_id,
        date
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
      ${dateFilter}
    ),
    event_stats AS (
      SELECT 
        COUNT(DISTINCT primary_key) as total_events,
        COUNT(DISTINCT CASE WHEN status = 'false' THEN primary_key END) as good_events,
        COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END) as error_events,
        COUNT(DISTINCT user_pseudo_id) as unique_users,
        MIN(date) as min_date,
        MAX(date) as max_date
      FROM deduplicated_events
    )
    SELECT 
      total_events,
      good_events,
      error_events,
      unique_users,
      min_date,
      max_date,
      SAFE_DIVIDE(error_events, total_events) * 100 as error_rate
    FROM event_stats
  `;
  const result = await runQuery(query);
  return result[0] || {};
}

// Récupérer les anomalies d'événements
async function getEventAnomalies(dateRange) {
  const dateFilter = dateRange && dateRange.start && dateRange.end
    ? `WHERE event_date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    : `WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const query = `
    SELECT 
      analysis_timestamp,
      event_date,
      event_name,
      events_count,
      median_value,
      mad_value,
      mad_score,
      anomaly_flag,
      anomaly_info
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_events_anomaly_reporting\`
    ${dateFilter}
    ORDER BY event_date DESC, event_name
    LIMIT 1000
  `;
  return runQuery(query);
}

// Récupérer les événements en temps réel
async function getRealtimeEvents() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    // MATIN : J-1 + J (Cumulé)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    // APRÈS-MIDI : J uniquement
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    SELECT DISTINCT
      expected_event_name,
      hour,
      event_timestamp,
      event_name,
      primary_key,
      page_location_value,
      CAST(is_missing_event_in_ga4 AS STRING) as is_missing_event_in_ga4,
      CAST(is_event_param_missing AS STRING) as is_event_param_missing,
      CAST(is_user_param_missing AS STRING) as is_user_param_missing,
      CAST(is_item_param_missing AS STRING) as is_item_param_missing,
      CAST(is_ecommerce_param_missing AS STRING) as is_ecommerce_param_missing,
      CAST(is_event_with_missing_params AS STRING) as is_event_with_missing_params,
      TO_JSON_STRING(event_params_list_expected) as event_params_list_expected,
      TO_JSON_STRING(user_params_list_expected) as user_params_list_expected,
      TO_JSON_STRING(item_params_list_expected) as item_params_list_expected,
      TO_JSON_STRING(ecommerce_params_list_expected) as ecommerce_params_list_expected,
      missing_event_params,
      missing_user_params,
      missing_item_params,
      missing_ecommerce_params,
      all_missing_params
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
    WHERE ${dateFilter}
    ORDER BY event_timestamp DESC
    LIMIT 500
  `;
  return runQuery(query);
}

// Récupérer la santé du tracking (exemple simplifié)
async function getTrackingHealth(dateRange) {
  const dateFilter = dateRange && dateRange.start && dateRange.end
    ? `WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    : `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const query = `
    SELECT 
      date,
      expected_event_name,
      event_name,
      primary_key,
      user_pseudo_id,
      CAST(is_event_with_missing_params AS STRING) as is_event_with_missing_params
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
    ${dateFilter}
    ORDER BY date DESC, event_name
    LIMIT 1000
  `;
  return runQuery(query);
}

// Statistiques par événement (Event Tracking)
async function getEventStatistics(dateRange) {
  const dateFilter = dateRange && dateRange.start && dateRange.end
    ? `WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    : `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        event_name,
        CAST(is_event_with_missing_params AS STRING) as status
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
      ${dateFilter}
    )
    SELECT 
      event_name,
      COUNT(DISTINCT primary_key) as hits,
      COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END) as hits_with_errors,
      SAFE_DIVIDE(COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END), COUNT(DISTINCT primary_key)) * 100 as error_percentage
    FROM deduplicated_events
    GROUP BY event_name
    ORDER BY hits DESC
    LIMIT 50
  `;
  return runQuery(query);
}

// Analyse des paramètres manquants (Parameter Analysis)
async function getParametersAnalysis(dateRange) {
  const dateFilter = dateRange && dateRange.start && dateRange.end
    ? `WHERE date BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
    : `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const query = `
    WITH all_missing_params AS (
      SELECT param as param_name, 'event' as param_type, COUNT(DISTINCT primary_key) as missing_occurrences
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`,
        UNNEST(missing_event_params) as param
      ${dateFilter} AND param IS NOT NULL AND param != ''
      GROUP BY param
      UNION ALL
      SELECT param as param_name, 'user' as param_type, COUNT(DISTINCT primary_key) as missing_occurrences
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`,
        UNNEST(missing_user_params) as param
      ${dateFilter} AND param IS NOT NULL AND param != ''
      GROUP BY param
      UNION ALL
      SELECT param as param_name, 'item' as param_type, COUNT(DISTINCT primary_key) as missing_occurrences
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`,
        UNNEST(missing_item_params) as param
      ${dateFilter} AND param IS NOT NULL AND param != ''
      GROUP BY param
    ),
    total_events AS (
      SELECT COUNT(DISTINCT primary_key) as total_count
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
      ${dateFilter}
    )
    SELECT 
      param_name,
      param_type,
      missing_occurrences as events_with_missing_param,
      total_count as total_events,
      SAFE_DIVIDE(missing_occurrences, total_count) * 100 as missing_percentage,
      CASE 
        WHEN SAFE_DIVIDE(missing_occurrences, total_count) * 100 >= 50 THEN 'Critique'
        WHEN SAFE_DIVIDE(missing_occurrences, total_count) * 100 >= 10 THEN 'Attention' 
        WHEN SAFE_DIVIDE(missing_occurrences, total_count) * 100 > 0 THEN 'Warning'
        ELSE 'Bon'
      END as status
    FROM all_missing_params
    CROSS JOIN total_events
    ORDER BY missing_occurrences DESC
    LIMIT 5;
  `;
  return runQuery(query);
}

// Statistiques par événement (Event Tracking) pour realtime
async function getRealtimeEventStats() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        event_name,
        CAST(is_event_with_missing_params AS STRING) as status
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
      WHERE ${dateFilter}
    )
    SELECT 
      event_name,
      COUNT(DISTINCT primary_key) as hits,
      COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END) as errors,
      SAFE_DIVIDE(COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END), COUNT(DISTINCT primary_key)) * 100 as error_percentage
    FROM deduplicated_events
    GROUP BY event_name
    ORDER BY hits DESC
    LIMIT 10
  `;
  return runQuery(query);
}

// Event Params
async function getRealtimeEventParams() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        event_params_list_expected
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
      WHERE ${dateFilter}
        AND event_params_list_expected IS NOT NULL
        AND ARRAY_LENGTH(event_params_list_expected) > 0
      LIMIT 5000
    ),
    flattened_params AS (
      SELECT 
        primary_key,
        param.event_param_key as param_key,
        CAST(param.is_missing AS INT64) as is_missing
      FROM deduplicated_events,
      UNNEST(event_params_list_expected) as param
      WHERE param.event_param_key IS NOT NULL
    )
    SELECT 
      param_key,
      COUNT(DISTINCT primary_key) as total_occurrences,
      COUNT(DISTINCT CASE WHEN is_missing = 1 THEN primary_key END) as missing_count,
      SAFE_DIVIDE(COUNT(DISTINCT CASE WHEN is_missing = 1 THEN primary_key END), COUNT(DISTINCT primary_key)) * 100 as missing_percentage
    FROM flattened_params
    GROUP BY param_key
    ORDER BY missing_percentage DESC, total_occurrences DESC
    LIMIT 10
  `;
  return runQuery(query);
}

// User Params
async function getRealtimeUserParams() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        missing_user_params
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
      WHERE ${dateFilter}
        AND missing_user_params IS NOT NULL
        AND ARRAY_LENGTH(missing_user_params) > 0
      LIMIT 3000
    ),
    flattened_missing AS (
      SELECT 
        primary_key,
        param as param_key
      FROM deduplicated_events,
      UNNEST(missing_user_params) as param
      WHERE param IS NOT NULL AND param != ''
    )
    SELECT 
      param_key,
      COUNT(DISTINCT primary_key) as total_occurrences,
      COUNT(DISTINCT primary_key) as missing_count,
      100.0 as missing_percentage
    FROM flattened_missing
    GROUP BY param_key
    ORDER BY total_occurrences DESC
    LIMIT 10
  `;
  return runQuery(query);
}

// Item Params
async function getRealtimeItemParams() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        item_params_list_expected
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
      WHERE ${dateFilter}
        AND item_params_list_expected IS NOT NULL
        AND ARRAY_LENGTH(item_params_list_expected) > 0
      LIMIT 5000
    ),
    flattened_params AS (
      SELECT 
        primary_key,
        param.item_param_key as param_key,
        CAST(param.is_missing AS INT64) as is_missing
      FROM deduplicated_events,
      UNNEST(item_params_list_expected) as param
      WHERE param.item_param_key IS NOT NULL
    )
    SELECT 
      param_key,
      COUNT(DISTINCT primary_key) as total_occurrences,
      COUNT(DISTINCT CASE WHEN is_missing = 1 THEN primary_key END) as missing_count,
      SAFE_DIVIDE(COUNT(DISTINCT CASE WHEN is_missing = 1 THEN primary_key END), COUNT(DISTINCT primary_key)) * 100 as missing_percentage
    FROM flattened_params
    GROUP BY param_key
    ORDER BY missing_percentage DESC, total_occurrences DESC
    LIMIT 10
  `;
  return runQuery(query);
}

// Page Stats (Page Location)
async function getRealtimePageStats() {
  const now = new Date();
  const currentHour = now.getHours();
  let dateFilter;
  if (currentHour < 12) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') IN ('${yesterdayStr}', '${todayStr}')`;
  } else {
    const todayStr = now.toISOString().split('T')[0];
    dateFilter = `DATE(event_timestamp, 'Europe/Paris') = '${todayStr}'`;
  }
  const query = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        page_location_value,
        CAST(is_event_with_missing_params AS STRING) as status
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_realtime_events_params_health\`
      WHERE ${dateFilter}
    )
    SELECT 
      page_location_value,
      COUNT(DISTINCT primary_key) as hits,
      COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END) as errors,
      SAFE_DIVIDE(COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END), COUNT(DISTINCT primary_key)) * 100 as error_percentage
    FROM deduplicated_events
    GROUP BY page_location_value
    HAVING COUNT(DISTINCT CASE WHEN status = 'true' THEN primary_key END) > 0
    ORDER BY error_percentage DESC
    LIMIT 10
  `;
  return runQuery(query);
}

// Nouvelle fonction complète pour la santé du tracking (logique Next.js)
async function getTrackingPlanFull({ start, end, event, page = 1, pageSize = 10 }) {
  // Construction des filtres SQL
  const dateFilter = start && end
    ? `WHERE date BETWEEN '${start}' AND '${end}'`
    : `WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)`;
  const eventFilter = event && event !== 'all'
    ? `AND expected_event_name = '${event}'`
    : '';
  const offset = (page - 1) * pageSize;

  // Requête pour le tracking plan (statut des événements attendus)
  const trackingPlanQuery = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        expected_event_name,
        event_name,
        date,
        CAST(is_event_with_missing_params AS STRING) as has_missing_params,
        CAST(is_missing_event_in_ga4 AS STRING) as missing_in_ga4
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
      ${dateFilter}
      ${eventFilter}
    ),
    event_summary AS (
      SELECT 
        expected_event_name,
        COUNT(DISTINCT primary_key) as total_events,
        COUNT(DISTINCT CASE WHEN has_missing_params = 'true' THEN primary_key END) as events_with_errors,
        COUNT(DISTINCT CASE WHEN missing_in_ga4 = 'true' THEN primary_key END) as missing_events_in_ga4,
        FORMAT_DATE('%Y-%m-%d', MIN(date)) as first_date,
        FORMAT_DATE('%Y-%m-%d', MAX(date)) as last_date,
        FORMAT_DATE('%Y-%m-%d', MIN(CASE WHEN has_missing_params = 'true' THEN date END)) as first_error_date,
        FORMAT_DATE('%Y-%m-%d', MAX(CASE WHEN has_missing_params = 'true' THEN date END)) as last_error_date,
        SAFE_DIVIDE(
          COUNT(DISTINCT CASE WHEN has_missing_params = 'true' THEN primary_key END),
          COUNT(DISTINCT primary_key)
        ) * 100 as error_percentage
      FROM deduplicated_events
      GROUP BY expected_event_name
    )
    SELECT 
      expected_event_name,
      CAST(total_events AS STRING) as total_events,
      CAST(events_with_errors AS STRING) as events_with_errors,
      CAST(missing_events_in_ga4 AS STRING) as missing_events_in_ga4,
      error_percentage,
      IFNULL(first_date, 'null') as first_date,
      IFNULL(last_date, 'null') as last_date,
      IFNULL(first_error_date, 'null') as first_error_date,
      IFNULL(last_error_date, 'null') as last_error_date,
      CASE 
        WHEN error_percentage = 0 THEN 'OK'
        WHEN error_percentage < 10 THEN 'WARNING'
        ELSE 'ERROR'
      END as status
    FROM event_summary
    ORDER BY 
      CASE 
        WHEN error_percentage >= 10 THEN 1 
        WHEN error_percentage > 0 THEN 2 
        ELSE 3 
      END,
      total_events DESC;
  `;

  // Requête pour les données du graphique temporel
  const chartDataQuery = `
    WITH deduplicated_events AS (
      SELECT DISTINCT
        primary_key,
        date,
        CAST(is_event_with_missing_params AS STRING) as has_missing_params
      FROM \
        \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
      ${dateFilter}
      ${eventFilter}
    )
    SELECT 
      date,
      COUNT(DISTINCT primary_key) as total_events,
      COUNT(DISTINCT CASE WHEN has_missing_params = 'true' THEN primary_key END) as events_with_missing_params,
      SAFE_DIVIDE(
        COUNT(DISTINCT CASE WHEN has_missing_params = 'true' THEN primary_key END),
        COUNT(DISTINCT primary_key)
      ) * 100 as pct_events_with_missing_params
    FROM deduplicated_events
    GROUP BY date
    ORDER BY date;
  `;

  // Requête pour compter le total d'événements avec erreurs (pour la pagination)
  const totalErrorsCountQuery = `
    SELECT 
      COUNT(DISTINCT primary_key) as total_errors_count
    FROM \
      \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
    ${dateFilter}
    ${eventFilter}
    AND CAST(is_event_with_missing_params AS STRING) = 'true'
  `;

  // Requête pour les événements détaillés paginés
  const eventsDetailQuery = `
    SELECT 
      date,
      FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%S', event_timestamp) as event_timestamp,
      expected_event_name,
      event_name,
      device_category,
      device_operating_system,
      device_browser,
      page_location_value,
      CAST(is_event_with_missing_params AS STRING) as is_event_with_missing_params,
      missing_event_params,
      missing_user_params,
      missing_item_params,
      missing_ecommerce_params,
      all_missing_params,
      ga_session_id as session_id
    FROM \
      \`${process.env.GOOGLE_CLOUD_PROJECT}.${dataset}.rep__ga4_history_events_params\`
    ${dateFilter}
    ${eventFilter}
    ORDER BY 
      CASE WHEN CAST(is_event_with_missing_params AS STRING) = 'true' THEN 0 ELSE 1 END,
      event_timestamp DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  // Exécution parallèle des requêtes
  const [trackingPlanResult, chartDataResult, totalErrorsResult, eventsDetailResult] = await Promise.all([
    runQuery(trackingPlanQuery),
    runQuery(chartDataQuery),
    runQuery(totalErrorsCountQuery),
    runQuery(eventsDetailQuery)
  ]);

  // Calcul des stats globales
  const totalEvents = trackingPlanResult.reduce((sum, event) => sum + parseInt(event.total_events || 0), 0);
  const totalErrors = trackingPlanResult.reduce((sum, event) => sum + parseInt(event.events_with_errors || 0), 0);
  const errorRate = totalEvents > 0 ? (totalErrors / totalEvents) * 100 : 0;
  const totalErrorsCount = totalErrorsResult[0]?.total_errors_count || 0;

  // Pagination
  const totalPages = Math.ceil(totalErrorsCount / pageSize) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    trackingPlan: trackingPlanResult,
    chartData: chartDataResult,
    eventsDetail: eventsDetailResult,
    stats: {
      totalEvents,
      totalErrors,
      errorRate,
      eventsWithErrors: trackingPlanResult.filter(e => parseInt(e.events_with_errors || 0) > 0).length,
      totalEventTypes: trackingPlanResult.length,
      totalErrorsCount: parseInt(totalErrorsCount)
    },
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: parseInt(totalErrorsCount),
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  };
}

module.exports = {
  runQuery,
  getDashboardMetrics,
  getEventAnomalies,
  getRealtimeEvents,
  getTrackingHealth,
  getEventStatistics,
  getParametersAnalysis,
  getRealtimeEventStats,
  getRealtimeEventParams,
  getRealtimeUserParams,
  getRealtimeItemParams,
  getRealtimePageStats,
  getTrackingPlanFull,
}; 