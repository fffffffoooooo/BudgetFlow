// ===============================
// CRON automatique :
// - Parcourt tous les abonnements actifs et automatiques
// - Pour chaque abonnement dont la date d'échéance est passée ou aujourd'hui :
//   - Crée une transaction de dépense
//   - Met à jour la prochaine date d'échéance (selon la fréquence)
//   - Envoie un email de confirmation de paiement
//   - Log et alerte en cas d'échec
// ===============================
require('dotenv').config({ path: __dirname + '/../.env' });

const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Category = require('../models/Category');
const { sendMail } = require('../utils/emailSender');
const { transactionAlertEmail } = require('../utils/emailTemplates');
const Alert = require('../models/Alert');

async function processSubscriptions() {
  try {
  const now = new Date();
    console.log(`[AUTO-PAY] Starting subscription processing at ${now.toISOString()}`);

    // Mode test : traiter tous les abonnements actifs et automatiques
    const isTestMode = process.env.SUBSCRIPTION_TEST_MODE === 'true';
    if (isTestMode) {
      console.log('[AUTO-PAY][TEST] Running in test mode - will process all active automatic subscriptions');
    }

    // 1. Traiter les paiements d'abonnements automatiques
    const subscriptions = await Subscription.find({});
    console.log(`[AUTO-PAY] Found ${subscriptions.length} subscriptions to check.`);

    let processedCount = 0;
    let errorCount = 0;

    for (const sub of subscriptions) {
      // Validation de la date d'échéance
      if (!sub.nextPaymentDate) {
        errorCount++;
        continue;
      }
      let nextDueDate;
      try {
        nextDueDate = new Date(sub.nextPaymentDate);
        if (isNaN(nextDueDate.getTime())) {
          errorCount++;
          continue;
        }
      } catch (error) {
        errorCount++;
        continue;
      }
      const isDue = nextDueDate <= now;
      if (!sub.isActive) continue;
      if (!sub.isAutomatic) continue;
      if (!isDue && !isTestMode) continue;
      // En mode test, traiter même si pas à échéance
      if (isTestMode && !isDue) {
        console.log(`[AUTO-PAY][PROCESSING][TEST] Processing subscription "${sub.name}" in test mode (not due yet)`);
      } else {
        console.log(`[AUTO-PAY][PROCESSING] Subscription "${sub.name}" is due. Processing payment.`);
      }
      
      try {
        // Créer la transaction automatiquement
        const transaction = new Transaction({
          user: sub.user,
          amount: sub.amount,
          type: 'expense',
          category: sub.category,
          description: `[Paiement automatique] ${sub.name}`,
          date: new Date(nextDueDate),
          isAutoGenerated: true
        });
        await transaction.save();

        console.log(`[AUTO-PAY][SUCCESS] Transaction created for subscription "${sub.name}" - Amount: ${sub.amount}€, Date: ${nextDueDate.toISOString()}`);

        // Mettre à jour la date du prochain paiement
        let nextPaymentDate = new Date(nextDueDate);
        switch (sub.frequency) {
          case 'monthly':
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            break;
          case 'weekly':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
            break;
          case 'yearly':
            nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
            break;
          case 'daily':
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
            break;
        }

        sub.lastPaymentDate = new Date();
        sub.nextPaymentDate = nextPaymentDate;
        await sub.save();

        console.log(`[AUTO-PAY][SUCCESS] Next payment date updated for "${sub.name}" to ${nextPaymentDate.toISOString()}`);

        // Notifier l'utilisateur par email
        const user = await User.findById(sub.user);
        if (user && user.settings.notifications.subscriptionPayments) {
          try {
          const category = await Category.findById(sub.category);
          const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
          const html = transactionAlertEmail({
            icon: '🔁',
            amount: `${sub.amount.toFixed(2)} €`,
            type: 'Dépense',
            category: category?.name || 'Abonnement',
              date: nextDueDate.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            description: `[Paiement automatique] ${sub.name}`,
            link: 'https://budgetflow.app/transactions'
          });
          await sendMail({
            to: recipientEmail,
            subject: `Paiement récurrent effectué – ${sub.name} | BudgetFlow`,
            html
          });
            console.log(`[AUTO-PAY][EMAIL] Confirmation envoyée à ${recipientEmail} pour l'abonnement "${sub.name}"`);
          } catch (emailError) {
            console.error(`[AUTO-PAY][EMAIL][ERROR] Failed to send confirmation email for subscription "${sub.name}":`, emailError.message);
            // L'erreur d'email ne doit pas empêcher le traitement de l'abonnement
          }
        }

        processedCount++;

      } catch (err) {
        console.error(`[AUTO-PAY][ERROR] Failed to process subscription "${sub.name}":`, err.message);
        errorCount++;
        // Créer une alerte en base en cas d'échec
        try {
          await Alert.create({
            user: sub.user,
            category: sub.category,
            type: 'subscription_payment_failed',
            message: `Erreur lors de la génération automatique de la transaction d'abonnement (${sub.name})`,
            metadata: { subscriptionId: sub._id, error: err.message, date: nextDueDate }
          });
        } catch (alertErr) {
          console.error('[AUTO-PAY][ALERT][ERROR] Failed to create failure alert in database:', alertErr);
        }
      }
  }

    // 2. Envoyer les rappels X jours avant la date d'échéance (abonnements manuels)
  const reminderWindow = 5; // jours max d'anticipation pour le rappel
  const reminderSubscriptions = await Subscription.find({
    isActive: true,
    isAutomatic: false,
      nextPaymentDate: { $gte: now, $lt: new Date(now.getTime() + 1000*60*60*24*reminderWindow) }
  });

  for (const sub of reminderSubscriptions) {
    // Utilise le paramètre personnalisé de rappel de l'abonnement
    const daysBefore = sub.reminderDays || 3;
      const nowDate = now.getTime();
      const dueDate = new Date(sub.nextPaymentDate).getTime();
    if (dueDate - nowDate <= daysBefore * 24 * 60 * 60 * 1000 && dueDate - nowDate > 0) {
      const user = await User.findById(sub.user);
      const category = await Category.findById(sub.category);
      const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
      const html = transactionAlertEmail({
        icon: '⏰',
        amount: `${sub.amount.toFixed(2)} €`,
        type: 'Dépense',
        category: category?.name || 'Abonnement',
          date: new Date(sub.nextPaymentDate).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        description: sub.name,
        link: 'https://budgetflow.app/transactions'
      });
      await sendMail({
        to: recipientEmail,
        subject: `Rappel paiement à venir – ${sub.name} | BudgetFlow`,
        html
      });
      // Création de l'alerte dans la base
      const existingAlert = await Alert.findOne({
        user: sub.user,
        category: sub.category,
        type: 'subscription_reminder',
        'metadata.subscriptionId': sub._id,
        resolved: false,
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }
      });
      if (!existingAlert) {
        const alert = new Alert({
          user: sub.user,
          category: sub.category,
          type: 'subscription_reminder',
            message: `Rappel : Paiement de l'abonnement "${sub.name}" prévu le ${new Date(sub.nextPaymentDate).toLocaleDateString('fr-FR')}`,
          metadata: {
            subscriptionId: sub._id,
            amount: sub.amount,
              nextPaymentDate: sub.nextPaymentDate,
            daysBefore
          }
        });
        await alert.save();
      }
    }
  }

    console.log(`[AUTO-PAY] Processing completed. Processed: ${processedCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('[AUTO-PAY][CRITICAL] Critical error during subscription processing:', error);
    throw error;
  }
}

// Traitement d'un seul abonnement (paiement immédiat après création)
async function processSingleSubscription(subscriptionId) {
  try {
    const sub = await Subscription.findById(subscriptionId);
    if (!sub) {
      console.log(`[AUTO-PAY][IMMEDIATE][ERROR] Subscription not found: ${subscriptionId}`);
      return;
    }
    if (!sub.isActive || !sub.isAutomatic) return;
    if (!sub.nextPaymentDate) return;
    const now = new Date();
    const nextDueDate = new Date(sub.nextPaymentDate);
    if (nextDueDate > now) return;
    console.log(`[AUTO-PAY][IMMEDIATE] Payment triggered after subscription creation: ${sub.name}`);
    try {
      const transaction = new Transaction({
        user: sub.user,
        amount: sub.amount,
        type: 'expense',
        category: sub.category,
        description: `[Paiement automatique] ${sub.name}`,
        date: new Date(nextDueDate),
        isAutoGenerated: true
      });
      await transaction.save();
      // Mettre à jour la date du prochain paiement
      let nextPaymentDate = new Date(nextDueDate);
      switch (sub.frequency) {
        case 'monthly': nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); break;
        case 'weekly': nextPaymentDate.setDate(nextPaymentDate.getDate() + 7); break;
        case 'yearly': nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1); break;
        case 'daily': nextPaymentDate.setDate(nextPaymentDate.getDate() + 1); break;
      }
      sub.lastPaymentDate = new Date();
      sub.nextPaymentDate = nextPaymentDate;
      await sub.save();
      // Notifier l'utilisateur par email
      const user = await User.findById(sub.user);
      if (user && user.settings.notifications.subscriptionPayments) {
        try {
          const category = await Category.findById(sub.category);
          const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
          const html = transactionAlertEmail({
            icon: '🔁',
            amount: `${sub.amount.toFixed(2)} €`,
            type: 'Dépense',
            category: category?.name || 'Abonnement',
            date: nextDueDate.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            description: `[Paiement automatique] ${sub.name}`,
            link: 'https://budgetflow.app/transactions'
          });
          await sendMail({
            to: recipientEmail,
            subject: `Paiement récurrent effectué – ${sub.name} | BudgetFlow`,
            html
          });
          console.log(`[AUTO-PAY][EMAIL] Confirmation envoyée à ${recipientEmail} pour l'abonnement "${sub.name}"`);
        } catch (emailError) {
          console.error(`[AUTO-PAY][EMAIL][ERROR] Failed to send confirmation email for subscription "${sub.name}":`, emailError.message);
        }
      }
    } catch (err) {
      console.error(`[AUTO-PAY][IMMEDIATE][ERROR] Failed to process subscription "${sub.name}":`, err.message);
      try {
        await Alert.create({
          user: sub.user,
          category: sub.category,
          type: 'subscription_payment_failed',
          message: `Erreur lors de la génération automatique de la transaction d'abonnement (${sub.name})`,
          metadata: { subscriptionId: sub._id, error: err.message, date: nextDueDate }
        });
      } catch (alertErr) {
        console.error('[AUTO-PAY][ALERT][ERROR] Failed to create failure alert in database:', alertErr);
      }
    }
  } catch (error) {
    console.error('[AUTO-PAY][IMMEDIATE][CRITICAL]', error);
  }
}

// Exporter la fonction pour pouvoir l'appeler depuis server.js
module.exports = { processSubscriptions, processSingleSubscription };

if (require.main === module) {
  // Seulement pour l'exécution standalone (pas depuis server.js)
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget-app';
  
  mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      return processSubscriptions();
    })
    .then(() => {
    console.log('Traitement des abonnements terminé.');
    process.exit(0);
    })
    .catch(err => {
    console.error('Erreur CRON abonnements:', err);
    process.exit(1);
    })
    .finally(() => {
      mongoose.disconnect();
  });
}
