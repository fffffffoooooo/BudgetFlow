const Alert = require('../models/Alert');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { 
  budgetLimitEmail, 
  budgetWarningEmail, 
  unusualExpenseEmail, 
  highSpendingEmail, 
  generalAlertEmail,
  netIncomeCeilingEmail,
  insufficientBalanceEmail
} = require('../utils/emailTemplates');
const { sendMail } = require('../utils/emailSender');

/**
 * Envoie un email pour une alerte donnée
 * @param {Object} alert - L'alerte à notifier
 * @param {Object} user - L'utilisateur destinataire
 * @param {Object} category - La catégorie concernée (optionnel)
 */
const sendAlertEmail = async (alert, user, category = null) => {
  try {
    // Vérifier si l'utilisateur a activé les notifications par email
    if (!user.settings?.notifications?.email) {
      console.log(`[ALERT][EMAIL] Notifications email désactivées pour l'utilisateur ${user._id}`);
      return;
    }

    // Vérifier les préférences spécifiques selon le type d'alerte
    const alertType = alert.type;
    const shouldSendEmail = 
      (alertType === 'budget_limit' && user.settings?.notifications?.budgetAlerts) ||
      (alertType === 'unusual_expense' && user.settings?.notifications?.unusualExpenses) ||
      (alertType === 'monthly_report' && user.settings?.notifications?.monthlyReports) ||
      (alertType === 'subscription_reminder' && user.settings?.notifications?.subscriptionPayments) ||
      (alertType === 'subscription_payment_failed' && user.settings?.notifications?.subscriptionPayments) ||
      (alertType === 'net_income_ceiling' && user.settings?.notifications?.budgetAlerts) ||
      (alertType === 'insufficient_balance' && user.settings?.notifications?.budgetAlerts);

    if (!shouldSendEmail) {
      console.log(`[ALERT][EMAIL] Notifications désactivées pour le type ${alertType} pour l'utilisateur ${user._id}`);
      return;
    }

    const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
    
    if (!recipientEmail) {
      console.error(`[ALERT][EMAIL] Aucun email trouvé pour l'utilisateur ${user._id}`);
      return;
    }

    let emailSubject = '';
    let emailHtml = '';

    // Générer l'email selon le type d'alerte
    switch (alertType) {
      case 'budget_limit':
        const metadata = alert.metadata || {};
        if (metadata.alertType === 'budget_warning') {
          emailSubject = `⚠️ Attention : Plafond approche – ${category?.name || 'Catégorie'} | BudgetFlow`;
          emailHtml = budgetWarningEmail({
            category: category?.name || 'Catégorie',
            amount: metadata.amount || 0,
            limit: metadata.limit || 0,
            percent: metadata.percentage || 0,
            link: 'https://budgetflow.app/budgets'
          });
        } else {
          emailSubject = `🚨 Plafond dépassé – ${category?.name || 'Catégorie'} | BudgetFlow`;
          emailHtml = budgetLimitEmail({
            category: category?.name || 'Catégorie',
            amount: metadata.amount || 0,
            limit: metadata.limit || 0,
            percent: metadata.percentage || 0,
            link: 'https://budgetflow.app/budgets'
          });
        }
        break;

      case 'unusual_expense':
        emailSubject = `📊 Activité inhabituelle détectée – ${category?.name || 'Catégorie'} | BudgetFlow`;
        emailHtml = unusualExpenseEmail({
          category: category?.name || 'Catégorie',
          transactionCount: alert.metadata?.transactionCount || 0,
          totalAmount: alert.metadata?.totalAmount || 0,
          link: 'https://budgetflow.app/transactions'
        });
        break;

      case 'budget_limit':
        emailSubject = `💰 Dépenses importantes – ${category?.name || 'Catégorie'} | BudgetFlow`;
        emailHtml = highSpendingEmail({
          category: category?.name || 'Catégorie',
          totalAmount: alert.metadata?.amount || 0,
          threshold: alert.metadata?.threshold || 500,
          link: 'https://budgetflow.app/transactions'
        });
        break;

      case 'net_income_ceiling':
        const netIncomeMetadata = alert.metadata || {};
        const period = netIncomeMetadata.period === 'weekly' ? 'hebdomadaire' : 'mensuel';
        emailSubject = `💰 Plafond de revenu net dépassé (${period}) | BudgetFlow`;
        emailHtml = netIncomeCeilingEmail({
          ceiling: netIncomeMetadata.ceiling || 0,
          reachedAmount: netIncomeMetadata.netIncome || 0,
          percentage: netIncomeMetadata.percentage || 0,
          period: period,
          income: netIncomeMetadata.income || 0,
          expenses: netIncomeMetadata.expenses || 0,
          link: 'https://budgetflow.app/alerts'
        });
        break;

      case 'net_income_ceiling_reached':
        emailSubject = `🔔 Plafond de revenu atteint – ${category?.name || 'Catégorie'} | BudgetFlow`;
        emailHtml = netIncomeCeilingEmail({
          ceiling: alert.details.ceiling,
          reachedAmount: alert.details.reachedAmount,
          percentage: alert.details.percentage,
          period: alert.details.period,
          link: `http://localhost:8081/profile`
        });
        break;

      case 'insufficient_balance':
        const balanceMetadata = alert.metadata || {};
        const balancePeriod = balanceMetadata.period === 'weekly' ? 'hebdomadaire' : 
                             balanceMetadata.period === 'monthly' ? 'mensuel' : 'total';
        emailSubject = `⚠️ Solde insuffisant (${balancePeriod}) | BudgetFlow`;
        emailHtml = insufficientBalanceEmail({
          period: balancePeriod,
          currentBalance: balanceMetadata.currentBalance || 0,
          ceiling: balanceMetadata.ceiling || 0,
          deficit: balanceMetadata.deficit || 0,
          percentage: balanceMetadata.percentage || 0,
          income: balanceMetadata.totalIncome || balanceMetadata.monthlyIncome || balanceMetadata.weeklyIncome || 0,
          expenses: balanceMetadata.totalExpenses || balanceMetadata.monthlyExpenses || balanceMetadata.weeklyExpenses || 0,
          link: 'https://budgetflow.app/alerts'
        });
        break;

      default:
        emailSubject = `🔔 Nouvelle alerte | BudgetFlow`;
        emailHtml = generalAlertEmail({
          title: 'Nouvelle alerte',
          message: alert.message,
          category: category?.name,
          metadata: alert.metadata,
          link: 'https://budgetflow.app/alerts'
        });
        break;
    }

    // Envoyer l'email
    await sendMail({
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml
    });

    console.log(`[ALERT][EMAIL] Email envoyé avec succès pour l'alerte ${alert._id} à ${recipientEmail}`);
  } catch (error) {
    console.error(`[ALERT][EMAIL] Erreur lors de l'envoi de l'email pour l'alerte ${alert._id}:`, error);
  }
};

/**
 * Vérifie les limites de budget pour toutes les catégories et génère des alertes si nécessaire
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Tableau des alertes générées
 */
const checkBudgetLimits = async (userId) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Récupérer l'utilisateur pour les préférences de notification
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Récupérer toutes les catégories avec des limites de budget
    const categories = await Category.find({ 
      user: userId,
      limit: { $gt: 0 } // Uniquement les catégories avec une limite définie
    });
    
    const generatedAlerts = [];
    
    // Pour chaque catégorie avec une limite, vérifier les dépenses du mois
    for (const category of categories) {
      const totalSpent = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            category: category._id,
            type: 'expense',
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            currency: { $first: '$currency' }
          }
        }
      ]);
      
      const total = totalSpent[0]?.total || 0;
      const currency = totalSpent[0]?.currency || 'EUR';
      const limit = category.limit;
      const percentage = (total / limit) * 100;
      
      // Vérifier si nous devons générer une alerte (70% du plafond atteint)
      if (percentage >= 70 && percentage < 100) {
        // Vérifier si une alerte similaire existe déjà ce mois-ci
        const existingAlert = await Alert.findOne({
          user: userId,
          category: category._id,
          type: 'budget_limit',
          'metadata.alertType': 'budget_warning',
          createdAt: { $gte: startOfMonth }
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            user: userId,
            category: category._id,
            type: 'budget_limit',
            message: `Attention : Vous avez atteint ${Math.round(percentage)}% du plafond pour la catégorie ${category.name}`,
            metadata: {
              alertType: 'budget_warning',
              amount: total,
              limit: limit,
              percentage: percentage,
              currency: currency
            }
          });
          
          await alert.save();
          generatedAlerts.push(alert);

          // Envoi de l'email de notification
          await sendAlertEmail(alert, user, category);
        }
      }
      
      // Générer une alerte si le plafond est dépassé
      if (percentage >= 100) {
        const existingAlert = await Alert.findOne({
          user: userId,
          category: category._id,
          type: 'budget_limit',
          'metadata.alertType': 'budget_exceeded',
          createdAt: { $gte: startOfMonth }
        });
        
        if (!existingAlert) {
          const alert = new Alert({
            user: userId,
            category: category._id,
            type: 'budget_limit',
            message: `Attention : Vous avez dépassé le plafond de ${limit}€ pour la catégorie ${category.name}`,
            metadata: {
              alertType: 'budget_exceeded',
              amount: total,
              limit: limit,
              percentage: percentage,
              currency: currency
            }
          });
          
          await alert.save();
          generatedAlerts.push(alert);

          // Envoi de l'email de notification
          await sendAlertEmail(alert, user, category);
        }
      }
    }
    
    return generatedAlerts;
  } catch (error) {
    console.error('Erreur lors de la vérification des limites de budget :', error);
    throw error;
  }
};

/**
 * Crée une alerte et envoie un email de notification
 * @param {Object} alertData - Données de l'alerte à créer
 * @returns {Promise<Object>} - L'alerte créée
 */
const createAlertWithEmail = async (alertData) => {
  try {
    const { userId, type, categoryId, message, metadata } = alertData;
    
    // Récupérer l'utilisateur et la catégorie
    const [user, category] = await Promise.all([
      User.findById(userId),
      categoryId ? Category.findById(categoryId) : null
    ]);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    // Créer l'alerte
    const alert = new Alert({
      user: userId,
      category: categoryId,
      type,
      message,
      metadata
    });
    
    await alert.save();
    
    // Envoyer l'email de notification
    await sendAlertEmail(alert, user, category);
    
    return alert;
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte avec email :', error);
    throw error;
  }
};

// Vérifier les limites de solde et créer des alertes si nécessaire
async function checkBalanceLimits(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.netIncomeCeiling) {
      return; // Aucun plafond défini
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    // Calculer le solde total
    const allTransactions = await Transaction.aggregate([
      {
        $match: { user: userId }
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

    // Calculer le solde mensuel
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      }
    ]);

    const monthlyBalance = (monthlyTransactions[0]?.totalIncome || 0) - (monthlyTransactions[0]?.totalExpenses || 0);

    // Calculer le solde hebdomadaire
    const weeklyTransactions = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      }
    ]);

    const weeklyBalance = (weeklyTransactions[0]?.totalIncome || 0) - (weeklyTransactions[0]?.totalExpenses || 0);
    const weeklyCeiling = user.netIncomeCeiling / 4;

    // Vérifier le solde total
    if (totalBalance < user.netIncomeCeiling) {
      const existingTotalAlert = await Alert.findOne({
        user: userId,
        type: 'insufficient_balance',
        'metadata.period': 'total',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (!existingTotalAlert) {
        await createAlertWithEmail({
          userId,
          type: 'insufficient_balance',
          message: `Votre solde total (${totalBalance.toFixed(2)}€) est inférieur au plafond défini (${user.netIncomeCeiling}€)`,
          metadata: {
            period: 'total',
            currentBalance: totalBalance,
            ceiling: user.netIncomeCeiling,
            deficit: user.netIncomeCeiling - totalBalance,
            totalIncome: allTransactions[0]?.totalIncome || 0,
            totalExpenses: allTransactions[0]?.totalExpenses || 0,
            percentage: (totalBalance / user.netIncomeCeiling) * 100
          }
        });
      }
    }

    // Vérifier le solde mensuel
    if (monthlyBalance < user.netIncomeCeiling) {
      const existingMonthlyAlert = await Alert.findOne({
        user: userId,
        type: 'insufficient_balance',
        'metadata.period': 'monthly',
        createdAt: { $gte: startOfMonth }
      });

      if (!existingMonthlyAlert) {
        await createAlertWithEmail({
          userId,
          type: 'insufficient_balance',
          message: `Votre solde mensuel (${monthlyBalance.toFixed(2)}€) est inférieur au plafond défini (${user.netIncomeCeiling}€)`,
          metadata: {
            period: 'monthly',
            currentBalance: monthlyBalance,
            ceiling: user.netIncomeCeiling,
            deficit: user.netIncomeCeiling - monthlyBalance,
            monthlyIncome: monthlyTransactions[0]?.totalIncome || 0,
            monthlyExpenses: monthlyTransactions[0]?.totalExpenses || 0,
            percentage: (monthlyBalance / user.netIncomeCeiling) * 100
          }
        });
      }
    }

    // Vérifier le solde hebdomadaire
    if (weeklyBalance < weeklyCeiling) {
      const existingWeeklyAlert = await Alert.findOne({
        user: userId,
        type: 'insufficient_balance',
        'metadata.period': 'weekly',
        createdAt: { $gte: startOfWeek }
      });

      if (!existingWeeklyAlert) {
        await createAlertWithEmail({
          userId,
          type: 'insufficient_balance',
          message: `Votre solde hebdomadaire (${weeklyBalance.toFixed(2)}€) est inférieur au plafond défini (${weeklyCeiling.toFixed(2)}€)`,
          metadata: {
            period: 'weekly',
            currentBalance: weeklyBalance,
            ceiling: weeklyCeiling,
            deficit: weeklyCeiling - weeklyBalance,
            weeklyIncome: weeklyTransactions[0]?.totalIncome || 0,
            weeklyExpenses: weeklyTransactions[0]?.totalExpenses || 0,
            percentage: (weeklyBalance / weeklyCeiling) * 100
          }
        });
      }
    }

  } catch (error) {
    console.error('Erreur lors de la vérification des limites de solde:', error);
  }
}

module.exports = {
  checkBudgetLimits,
  sendAlertEmail,
  createAlertWithEmail,
  checkBalanceLimits
};
