const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-app';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/export', require('./routes/export'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/admin/smtp-config', require('./routes/smtpConfig'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/exchange', require('./routes/exchange'));
const savingsGoalsRoutes = require('./routes/savingsGoals');
app.use('/api/savings-goals', savingsGoalsRoutes);

const PORT = process.env.PORT || 5000;

// Fonction pour exécuter le traitement des abonnements
async function runSubscriptionPayments() {
  console.log('[SERVER] Subscription payments check triggered (interval)');
  try {
    // Importer et exécuter directement la fonction
    const { processSubscriptions } = require('./cron/subscriptionPayments');
    await processSubscriptions();
  } catch (error) {
    console.error('[SERVER] Error during subscription payments processing:', error);
    }
}

// Exécuter au démarrage après un délai pour laisser MongoDB se connecter
setTimeout(() => {
  console.log('[SERVER] Initial subscription payments check starting...');
runSubscriptionPayments();
}, 2000);

// Puis toutes les 5 minutes (5 * 60 * 1000 ms)
const INTERVAL_MINUTES = 5;
setInterval(runSubscriptionPayments, INTERVAL_MINUTES * 60 * 1000);
console.log(`[SERVER] Subscription payments check scheduled to run every ${INTERVAL_MINUTES} minutes`);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
