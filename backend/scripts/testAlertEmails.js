const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Alert = require('../models/Alert');
const { sendAlertEmail } = require('../services/alertService');
require('dotenv').config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/budgetflow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAlertEmails() {
  try {
    console.log('🔍 Test d\'envoi d\'emails pour les alertes...\n');

    // Récupérer un utilisateur de test
    const user = await User.findOne();
    if (!user) {
      console.error('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log(`👤 Utilisateur de test: ${user.name} (${user.email})`);
    console.log(`📧 Email d'alerte: ${user.alertEmail || user.email}\n`);

    // Récupérer une catégorie de test
    const category = await Category.findOne({ user: user._id });
    if (!category) {
      console.error('❌ Aucune catégorie trouvée pour cet utilisateur');
      return;
    }

    console.log(`📂 Catégorie de test: ${category.name}\n`);

    // Créer des alertes de test
    const testAlerts = [
      {
        type: 'budget_limit',
        message: 'Test: Plafond dépassé pour la catégorie test',
        metadata: {
          alertType: 'budget_warning',
          amount: 750,
          limit: 1000,
          percentage: 75
        }
      },
      {
        type: 'budget_limit',
        message: 'Test: Plafond complètement dépassé',
        metadata: {
          alertType: 'budget_exceeded',
          amount: 1200,
          limit: 1000,
          percentage: 120
        }
      },
      {
        type: 'unusual_expense',
        message: 'Test: Activité inhabituelle détectée',
        metadata: {
          transactionCount: 15,
          totalAmount: 850
        }
      }
    ];

    console.log('📧 Test d\'envoi d\'emails pour différents types d\'alertes...\n');

    for (let i = 0; i < testAlerts.length; i++) {
      const alertData = testAlerts[i];
      
      console.log(`📨 Test ${i + 1}: ${alertData.type}`);
      
      // Créer l'alerte
      const alert = new Alert({
        user: user._id,
        category: category._id,
        type: alertData.type,
        message: alertData.message,
        metadata: alertData.metadata
      });

      await alert.save();

      // Envoyer l'email
      try {
        await sendAlertEmail(alert, user, category);
        console.log(`✅ Email envoyé avec succès pour l'alerte ${alert._id}`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'envoi de l'email:`, error.message);
      }

      console.log('');
    }

    // Test de vérification des plafonds
    console.log('🔍 Test de vérification automatique des plafonds...\n');

    try {
      const { checkBudgetLimits } = require('../services/alertService');
      const generatedAlerts = await checkBudgetLimits(user._id.toString());
      
      console.log(`📊 ${generatedAlerts.length} alertes générées automatiquement`);
      
      if (generatedAlerts.length > 0) {
        console.log('📋 Détails des alertes générées:');
        generatedAlerts.forEach((alert, index) => {
          console.log(`  ${index + 1}. ${alert.message}`);
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des plafonds:', error.message);
    }

    console.log('\n✅ Tests terminés !');
    console.log('\n📝 Vérifiez votre boîte email pour voir les emails reçus.');
    console.log('📧 Email de réception:', user.alertEmail || user.email);

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
}

// Exécuter les tests
testAlertEmails(); 