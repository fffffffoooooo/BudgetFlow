const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');

// Vérifier si un budget a atteint ou dépassé son plafond
exports.checkBudgetLimits = async (userId, categoryId) => {
  try {
    // Récupérer le budget pour cette catégorie
    const budget = await Budget.findOne({
      user: userId,
      category: categoryId
    });

    // Si aucun budget n'est défini pour cette catégorie, sortir
    if (!budget) return;

    // Déterminer la période (mois en cours par défaut)
    const now = new Date();
    let startDate, endDate;
    
    switch(budget.period) {
      case 'weekly':
        // Début et fin de la semaine en cours
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuster si dimanche
        startDate = new Date(now.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        // Début et fin de l'année en cours
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'monthly':
      default:
        // Début et fin du mois en cours
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Calculer la somme des dépenses pour cette catégorie pendant la période
    const expenses = await Transaction.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          category: mongoose.Types.ObjectId(categoryId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = expenses[0]?.total || 0;
    
    // Vérifier si le montant dépensé dépasse le budget
    const percentUsed = (totalSpent / budget.amount) * 100;
    
    // Créer une alerte si le montant dépasse 90% du budget
    if (percentUsed >= 90) {
      // Vérifier si une alerte similaire existe déjà et n'est pas résolue
      const existingAlert = await Alert.findOne({
        user: userId,
        category: categoryId,
        type: 'budget_limit',
        resolved: false,
        createdAt: { $gte: startDate }
      });
      
      if (!existingAlert) {
        // Créer une nouvelle alerte
        const alert = new Alert({
          user: userId,
          category: categoryId,
          type: 'budget_limit',
          message: `Vous avez dépensé ${percentUsed.toFixed(0)}% de votre budget pour ${budget.category.name}`,
          metadata: {
            budget: budget.amount,
            spent: totalSpent,
            percent: percentUsed
          }
        });
        
        await alert.save();
        console.log('Alerte de budget créée:', alert);
// Envoi d'un e-mail HTML d'alerte budget
try {
  const User = require('../models/User');
  const { sendMail } = require('../utils/emailSender');
  const { budgetLimitEmail } = require('./emailTemplates');
  const user = await User.findById(userId);
  const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
  const category = await Category.findById(categoryId);
  const html = budgetLimitEmail({
    category: category?.name || 'Catégorie',
    amount: totalSpent.toFixed(2),
    limit: budget.amount.toFixed(2),
    percent: percentUsed.toFixed(2),
    link: 'https://budgetflow.app/budgets'
  });
  await sendMail({
    to: recipientEmail,
    subject: `⚠️ Plafond de budget atteint - ${category?.name || 'Catégorie'}`,
    html
  });
} catch (mailErr) {
  console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de dépassement de plafond:', mailErr);
}
      }
    }
    
    return { budget, totalSpent, percentUsed };
  } catch (error) {
    console.error('Erreur lors de la vérification des plafonds de budget:', error);
    throw error;
  }
};

// Vérifier les dépenses inhabituelles
// Utilitaire pour obtenir un ObjectId sûr
function toObjectId(id) {
  if (typeof id === 'string' && id.match(/^[a-f\d]{24}$/i)) {
    return new mongoose.Types.ObjectId(id);
  }
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  throw new Error('ID invalide pour ObjectId: ' + id);
}

exports.checkUnusualExpenses = async (userId, transaction) => {
  try {
    // Obtenir la moyenne des dépenses pour cette catégorie au cours des 3 derniers mois
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const categoryAvg = await Transaction.aggregate([
      {
        $match: {
          user: toObjectId(userId),
          category: toObjectId(transaction.category),
          type: 'expense',
          date: { $gte: threeMonthsAgo, $lt: new Date(transaction.date) }
        }
      },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // S'il y a assez de données historiques et que la nouvelle transaction est nettement plus élevée
    if (categoryAvg.length > 0 && categoryAvg[0].count >= 3) {
      const avgAmount = categoryAvg[0].avgAmount;
      const threshold = avgAmount * 1.5; // 50% au-dessus de la moyenne
      
      if (transaction.amount > threshold) {
        // Récupérer le nom de la catégorie
        const category = await Category.findById(transaction.category);
        
        // Créer une alerte
        const alert = new Alert({
          user: userId,
          category: transaction.category,
          type: 'unusual_expense',
          message: `Dépense inhabituelle de ${transaction.amount.toFixed(2)}€ pour ${category.name}`,
          metadata: {
            transaction: transaction._id,
            average: avgAmount,
            amount: transaction.amount,
            difference: transaction.amount - avgAmount
          }
        });
        
        await alert.save();
        console.log('Alerte de dépense inhabituelle créée:', alert);

        // Envoi d'un email de notification
        try {
          const User = require('../models/User');
          const { sendMail } = require('../utils/emailSender');
          const user = await User.findById(userId);
          const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
          const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 0; margin: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.10);">
                <tr style="background: #e53935; color: #fff;">
                  <td style="padding: 18px 32px; font-size: 1.5rem; font-weight: bold; letter-spacing: 1px;">
                    🚨 Activité inhabituelle détectée
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 32px;">
                    <h2 style="margin-top: 0; color: #e53935;">Dépense inhabituelle détectée</h2>
                    <ul style="padding-left:1em;">
                      <li>Catégorie : <b>${category.name}</b></li>
                      <li>Montant : <b>${transaction.amount.toFixed(2)}€</b></li>
                      <li>Moyenne habituelle : <b>${avgAmount.toFixed(2)}€</b></li>
                      <li>Différence : <b>+${(transaction.amount - avgAmount).toFixed(2)}€</b></li>
                      <li>Date : <b>${new Date(transaction.date).toLocaleString('fr-FR')}</b></li>
                    </ul>
                    <p>Consultez votre <a href="https://budgetflow.app/transactions" style="color:#2b7cff;">historique des transactions</a> pour plus de détails.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f6f8fa; color: #888; font-size: 0.95rem; padding: 16px 32px; text-align: center;">
                    Cet email est envoyé automatiquement par BudgetFlow – ne pas répondre.
                  </td>
                </tr>
              </table>
            </div>
          `;
          await sendMail({
            to: recipientEmail,
            subject: `🚨 Dépense inhabituelle détectée - ${category.name}`,
            html
          });
        } catch (mailErr) {
          console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de dépense inhabituelle:', mailErr);
        }
      }
    }

    // Détection du nombre de transactions sur 24h
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const txCount24h = await Transaction.countDocuments({
      user: toObjectId(userId),
      type: 'expense',
      date: { $gte: twentyFourHoursAgo }
    });
    if (txCount24h > 10) {
      // Vérifier si une alerte similaire existe déjà dans les dernières 24h
      const existingAlert = await Alert.findOne({
        user: userId,
        type: 'unusual_expense',
        'metadata.alertType': 'tx_count_24h',
        createdAt: { $gte: twentyFourHoursAgo }
      });
      if (!existingAlert) {
        const alert = new Alert({
          user: userId,
          type: 'unusual_expense',
          message: `Plus de 10 transactions de dépense ont été enregistrées au cours des dernières 24h.`,
          metadata: {
            alertType: 'tx_count_24h',
            count: txCount24h,
            period: {
              from: twentyFourHoursAgo,
              to: new Date()
            }
          }
        });
        await alert.save();
        // Envoi d'un email personnalisé
        try {
          const User = require('../models/User');
          const { sendMail } = require('../utils/emailSender');
          const user = await User.findById(userId);
          const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
          const html = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 0; margin: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.10);">
                <tr style="background: #e53935; color: #fff;">
                  <td style="padding: 18px 32px; font-size: 1.5rem; font-weight: bold; letter-spacing: 1px;">
                    🚨 Activité inhabituelle détectée
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px 32px;">
                    <h2 style="margin-top: 0; color: #e53935;">Dépenses inhabituelles détectées</h2>
                    <p>Plus de 10 transactions de dépense ont été enregistrées sur votre compte au cours des dernières 24 heures.</p>
                    <ul style="padding-left:1em;">
                      <li>Nombre de transactions : <b>${txCount24h}</b></li>
                      <li>Période : <b>${twentyFourHoursAgo.toLocaleString('fr-FR')}</b> à <b>${new Date().toLocaleString('fr-FR')}</b></li>
                    </ul>
                    <p>Consultez votre <a href="https://budgetflow.app/transactions" style="color:#2b7cff;">historique des transactions</a> pour plus de détails.</p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #f6f8fa; color: #888; font-size: 0.95rem; padding: 16px 32px; text-align: center;">
                    Cet email est envoyé automatiquement par BudgetFlow – ne pas répondre.
                  </td>
                </tr>
              </table>
            </div>
          `;
          await sendMail({
            to: recipientEmail,
            subject: `🚨 Dépenses inhabituelles détectées (nombre de transactions)` ,
            html
          });
        } catch (mailErr) {
          console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de dépenses inhabituelles (nombre):', mailErr);
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des dépenses inhabituelles:', error);
    throw error;
  }
};
