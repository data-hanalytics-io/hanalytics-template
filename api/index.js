const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDashboardMetrics, getEventAnomalies, getRealtimeEvents, getTrackingHealth, getEventStatistics, getParametersAnalysis, getRealtimeEventStats, getRealtimeEventParams, getRealtimeUserParams, getRealtimeItemParams, getRealtimePageStats, getTrackingPlanFull } = require('./bigquery');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const serverlessExpress = require('@vendia/serverless-express');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Endpoint pour les métriques du dashboard (corrigé)
app.get('/api/dashboard', async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateRange = start && end ? { start, end } : undefined;
    const [metrics, eventStats, parametersAnalysis] = await Promise.all([
      getDashboardMetrics(dateRange),
      getEventStatistics(dateRange),
      getParametersAnalysis(dateRange)
    ]);
    res.json({
      success: true,
      data: {
        metrics,
        eventStats,
        parametersAnalysis
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour les anomalies
app.get('/api/anomaly', async (req, res) => {
  try {
    const { start, end } = req.query;
    const anomalies = await getEventAnomalies(start && end ? { start, end } : undefined);
    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour les événements temps réel (corrigé)
app.get('/api/realtime', async (req, res) => {
  try {
    const [events, eventStats, pageStats, eventParams, userParams, itemParams] = await Promise.all([
      getRealtimeEvents(),
      getRealtimeEventStats(),
      getRealtimePageStats(),
      getRealtimeEventParams(),
      getRealtimeUserParams(),
      getRealtimeItemParams()
    ]);
    res.json({
      success: true,
      data: {
        events,
        eventStats,
        pageStats,
        eventParams,
        userParams,
        itemParams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint pour la santé du tracking
app.get('/api/tracking', async (req, res) => {
  try {
    const { start, end, event, page = 1, pageSize = 10 } = req.query;
    const tracking = await getTrackingPlanFull({
      start,
      end,
      event,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10)
    });
    res.json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware pour vérifier le JWT et le rôle admin
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Accès admin requis' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
}

// Route GET /api/users (admin)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const { runQuery } = require('./bigquery');
    const query = `
      SELECT id, email, prenom, role, FORMAT_TIMESTAMP('%Y-%m-%d', created_at, 'UTC') as created_at, FORMAT_TIMESTAMP('%Y-%m-%d', last_login, 'UTC') as last_login, is_active
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
      ORDER BY created_at DESC
    `;
    const users = await runQuery(query);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Route POST /api/users (admin)
app.post('/api/users', requireAdmin, async (req, res) => {
  const { email, password, prenom, role } = req.body;
  if (!email || !password || !prenom || !role) {
    return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Rôle invalide' });
  }
  try {
    const { runQuery } = require('./bigquery');
    // Vérifier unicité email
    const checkQuery = `
      SELECT email FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
      WHERE email = '${email}'
      LIMIT 1
    `;
    const existingUsers = await runQuery(checkQuery);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, error: 'Cet email est déjà utilisé' });
    }
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    const { v4: uuidv4 } = require('uuid');
    const userId = uuidv4();
    // Insertion
    const insertQuery = `
      INSERT INTO \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
      (id, email, password, prenom, role, created_at, is_active)
      VALUES ('${userId}', '${email}', '${hashedPassword}', '${prenom}', '${role}', CURRENT_TIMESTAMP(), true)
    `;
    await runQuery(insertQuery);
    res.json({ success: true, message: 'Utilisateur créé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// Nouvelle route de login avec BigQuery et bcrypt
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
  }
  try {
    // Requête pour trouver l'utilisateur actif
    const query = `
      SELECT id, email, password, prenom, role, is_active
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
      WHERE email = '${email}' AND is_active = true
      LIMIT 1
    `;
    const { runQuery } = require('./bigquery');
    const users = await runQuery(query);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
    }
    const user = users[0];
    // Vérification du mot de passe hashé
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe incorrect' });
    }
    // Mise à jour du last_login
    try {
      const updateQuery = `
        UPDATE \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
        SET last_login = CURRENT_TIMESTAMP()
        WHERE email = '${email}'
      `;
      await runQuery(updateQuery);
    } catch (e) {
      // On ignore l'erreur de mise à jour du last_login
    }
    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, prenom: user.prenom, role: user.role },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '1d' }
    );
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Route DELETE /api/users/:id (admin)
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID requis' });
  }
  // Empêcher la suppression de soi-même
  if (req.user && req.user.id === id) {
    return res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous supprimer vous-même.' });
  }
  try {
    const { runQuery } = require('./bigquery');
    const deleteQuery = `
      DELETE FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${process.env.BIGQUERY_DATASET}.users\`
      WHERE id = '${id}'
    `;
    await runQuery(deleteQuery);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// Route catch-all compatible Vercel/Express
app.get('/*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
}); 