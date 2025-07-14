const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const { checkBalanceLimits } = require('../services/alertService');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budgetflow';

async function testBalanceAlerts() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur de test
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Utilisateur de test non trouvé. Créez d\'abord un utilisateur avec l\'email test@example.com');
      return;
    }

    console.log(`👤 Utilisateur trouvé: ${user.name} (${user.email})`);
    console.log(`💰 Plafond défini: ${user.netIncomeCeiling || 'Aucun'}€`);

    if (!user.netIncomeCeiling) {
      console.log('⚠️ Aucun plafond défini. Définissez d\'abord un plafond dans le profil.');
      return;
    }

    // Calculer le solde actuel
    const allTransactions = await Transaction.aggregate([
      {
        $match: { user: user._id }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      }
    ]);

    const totalBalance = (allTransactions[0]?.totalIncome || 0) - (allTransactions[0]?.totalExpenses || 0);
    console.log(`\n📊 Solde actuel: ${totalBalance.toFixed(2)}€`);
    console.log(`📈 Revenus totaux: ${(allTransactions[0]?.totalIncome || 0).toFixed(2)}€`);
    console.log(`📉 Dépenses totales: ${(allTransactions[0]?.totalExpenses || 0).toFixed(2)}€`);

    // Vérifier si le solde est insuffisant
    if (totalBalance < user.netIncomeCeiling) {
      console.log(`\n⚠️ ALERTE: Le solde (${totalBalance.toFixed(2)}€) est inférieur au plafond (${user.netIncomeCeiling}€)`);
      console.log(`📉 Déficit: ${(user.netIncomeCeiling - totalBalance).toFixed(2)}€`);
      console.log(`📊 Pourcentage: ${((totalBalance / user.netIncomeCeiling) * 100).toFixed(1)}%`);
      
      // Déclencher la vérification des alertes
      console.log('\n🔍 Déclenchement de la vérification des alertes...');
      await checkBalanceLimits(user._id);
      
      // Vérifier si une alerte a été créée
      const recentAlert = await Alert.findOne({
        user: user._id,
        type: 'insufficient_balance',
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Dernières 5 minutes
      });

      if (recentAlert) {
        console.log('✅ Alerte créée avec succès!');
        console.log(`📝 Message: ${recentAlert.message}`);
        console.log(`📅 Date: ${recentAlert.createdAt}`);
        console.log(`📊 Métadonnées:`, recentAlert.metadata);
      } else {
        console.log('❌ Aucune alerte créée (peut-être qu\'une alerte similaire existe déjà)');
      }
    } else {
      console.log(`\n✅ Le solde (${totalBalance.toFixed(2)}€) est supérieur au plafond (${user.netIncomeCeiling}€)`);
      console.log(`📈 Marge: ${(totalBalance - user.netIncomeCeiling).toFixed(2)}€`);
    }

    // Afficher les alertes existantes
    const existingAlerts = await Alert.find({
      user: user._id,
      type: 'insufficient_balance'
    }).sort({ createdAt: -1 }).limit(5);

    if (existingAlerts.length > 0) {
      console.log('\n📋 Alertes de solde insuffisant existantes:');
      existingAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.message} (${alert.createdAt.toLocaleString()})`);
        console.log(`   Période: ${alert.metadata?.period || 'N/A'}`);
        console.log(`   Solde: ${alert.metadata?.currentBalance?.toFixed(2) || 'N/A'}€`);
        console.log(`   Plafond: ${alert.metadata?.ceiling?.toFixed(2) || 'N/A'}€`);
        console.log(`   Lu: ${alert.read ? 'Oui' : 'Non'}`);
        console.log('');
      });
    } else {
      console.log('\n📋 Aucune alerte de solde insuffisant existante');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  testBalanceAlerts();
}

module.exports = { testBalanceAlerts }; 