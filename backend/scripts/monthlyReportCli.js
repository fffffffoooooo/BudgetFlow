#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const { generateMonthlyReport, formatReportText } = require('../utils/monthlyReport');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tradehub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erreur de connexion MongoDB :'));
db.once('open', async () => {
  console.log('Connecté à la base de données MongoDB');
  
  try {
    await main();
  } catch (error) {
    console.error('Erreur lors de l\'exécution du rapport:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
});

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  
  if (!email) {
    console.log('Utilisation: node scripts/monthlyReportCli.js <email> [mois] [année]');
    console.log('Exemple: node scripts/monthlyReportCli.js admin@example.com 5 2023');
    process.exit(1);
  }
  
  // Get the user by email
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`Aucun utilisateur trouvé avec l'email: ${email}`);
    process.exit(1);
  }
  
  // Parse month and year (default to previous month)
  const now = new Date();
  let month = args[1] ? parseInt(args[1]) - 1 : now.getMonth() - 1;
  let year = args[2] ? parseInt(args[2]) : now.getFullYear();
  
  // Handle year rollover
  if (month < 0) {
    month = 11;
    year--;
  }
  
  console.log(`Génération du rapport pour ${month + 1}/${year}...\n`);
  
  // Generate the report
  const report = await generateMonthlyReport(user._id, year, month);
  
  // Format and display the report
  const reportText = formatReportText(report);
  console.log(reportText);
  
  console.log('\nRapport généré avec succès!');
}
