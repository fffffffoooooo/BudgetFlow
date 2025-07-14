const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { checkBudgetLimits, createAlertWithEmail } = require('../services/alertService');
const User = require('../models/User');

// recuperer toutes les alertes avec filtres
router.get('/', auth, async (req, res) => {
  try {
    // verifier les limites de budget avant de racuperer les alertes
    try {
      await checkBudgetLimits(req.userId);
    } catch (error) {
      console.error('Erreur lors de la vérification des limites de budget :', error);
      // ne pas echouer la requete si la verification echoue
    }
    
    const { status = 'all' } = req.query;
    let query = { user: req.userId };
    
    if (status === 'unread') {
      query.read = false;
    } else if (status === 'resolved') {
      query.resolved = true;
    } else if (status === 'active') {
      query.resolved = false;
    }
    
    const alerts = await Alert.find(query)
      .populate('category', 'name color')
      .sort({ createdAt: -1 });
    
    // Statistiques des alertes
    const stats = await Alert.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$resolved', true] }, 1, 0] } }
        }
      }
    ]);
    
    const alertStats = stats[0] || { total: 0, unread: 0, resolved: 0 };
    
    res.json({ 
      alerts,
      stats: alertStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer plusieurs alertes comme lues
router.put('/mark-as-read', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs des alertes requis' });
    }
    
    await Alert.updateMany(
      { 
        _id: { $in: ids },
        user: req.userId
      },
      { $set: { read: true } }
    );
    
    res.json({ message: 'Alertes marquées comme lues' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Générer des alertes automatiques basées sur les dépenses
router.post('/generate-spending-alerts', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Analyser les dépenses par catégorie ce mois-ci
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      }
    ]);
    
    const generatedAlerts = [];

    for (const spending of categorySpending) {
      const category = spending.categoryInfo[0];
      
      // Alerte si plus de 10 transactions dans une catégorie ce mois-ci
      if (spending.count > 10) {
        const existingAlert = await Alert.findOne({
          user: req.userId,
          category: spending._id,
          type: 'unusual_expense',
          createdAt: { $gte: startOfMonth }
        });
        
        if (!existingAlert) {
          try {
            const alert = await createAlertWithEmail({
              userId: req.userId,
            type: 'unusual_expense',
              categoryId: spending._id,
            message: `Activité inhabituelle détectée pour ${category?.name}: ${spending.count} transactions ce mois-ci`,
            metadata: {
              transactionCount: spending.count,
              totalAmount: spending.total
            }
          });
          
          generatedAlerts.push(alert);
          } catch (error) {
            console.error('Erreur lors de la création de l\'alerte unusual_expense:', error);
          }
        }
      }
      
      // Alerte si dépenses importantes (> 500€ dans une catégorie)
      if (spending.total > 500) {
        const existingAlert = await Alert.findOne({
          user: req.userId,
          category: spending._id,
          type: 'budget_limit',
          createdAt: { $gte: startOfMonth }
        });
        
        if (!existingAlert) {
          try {
            const alert = await createAlertWithEmail({
              userId: req.userId,
            type: 'budget_limit',
              categoryId: spending._id,
            message: `Dépenses importantes dans ${category?.name}: ${spending.total.toFixed(2)}€ ce mois-ci`,
            metadata: {
              amount: spending.total,
              threshold: 500
            }
          });
          
          generatedAlerts.push(alert);
          } catch (error) {
            console.error('Erreur lors de la création de l\'alerte budget_limit:', error);
          }
        }
      }
    }
    
    res.json({ 
      message: `${generatedAlerts.length} nouvelles alertes générées`,
      alerts: generatedAlerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une alerte comme lue
router.put('/:id/read', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: { read: true } },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    res.json({ alert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Marquer une alerte comme résolue
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: { resolved: true } },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    res.json({ alert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle alerte pour l'utilisateur
router.post('/', auth, async (req, res) => {
  try {
    const { type, categoryId, threshold, message } = req.body;
    
    // Vérifier que la catégorie appartient bien à l'utilisateur
    if (categoryId) {
      const category = await Category.findOne({ 
        _id: categoryId,
        user: req.userId 
      });
      
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
    }
    
    const alert = await createAlertWithEmail({
      userId: req.userId,
      type,
      categoryId,
      message: message || `Alerte de type ${type}`,
      metadata: { threshold }
    });
    
    res.status(201).json({
      alert: await Alert.findById(alert._id).populate('category', 'name color')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une alerte
router.delete('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    res.json({ message: 'Alerte supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les paramètres de notification
router.get('/settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      settings: user.settings?.notifications || {
        email: true,
        app: true,
        budgetAlerts: true,
        unusualExpenses: true,
        subscriptionPayments: true,
        monthlyReports: false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour les paramètres de notification
router.put('/settings', auth, async (req, res) => {
  try {
    const { notifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        $set: { 
          'settings.notifications': notifications 
        } 
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      settings: user.settings?.notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Déclencher manuellement la vérification des plafonds et l'envoi d'emails
router.post('/check-budget-limits', auth, async (req, res) => {
  try {
    console.log(`[ALERT] Vérification manuelle des plafonds pour l'utilisateur ${req.userId}`);
    
    const generatedAlerts = await checkBudgetLimits(req.userId);
    
    res.json({ 
      message: `${generatedAlerts.length} alertes générées`,
      alerts: generatedAlerts,
      details: {
        budgetWarnings: generatedAlerts.filter(a => a.metadata?.alertType === 'budget_warning').length,
        budgetExceeded: generatedAlerts.filter(a => a.metadata?.alertType === 'budget_exceeded').length,
        emailsSent: generatedAlerts.length // Chaque alerte génère un email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification manuelle des plafonds :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Test d'envoi d'email pour une alerte spécifique
router.post('/test-email', auth, async (req, res) => {
  try {
    const { alertId } = req.body;
    
    if (!alertId) {
      return res.status(400).json({ message: 'ID de l\'alerte requis' });
    }
    
    const alert = await Alert.findOne({ _id: alertId, user: req.userId })
      .populate('category', 'name color');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Importer la fonction sendAlertEmail
    const { sendAlertEmail } = require('../services/alertService');
    
    await sendAlertEmail(alert, user, alert.category);
    
    res.json({ 
      message: 'Email de test envoyé avec succès',
      alert: alert,
      recipient: user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de test :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier le plafond de revenu net et créer des alertes
router.post('/check-net-income-ceiling', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.netIncomeCeiling) {
      return res.json({ 
        alert: false, 
        message: 'Aucun plafond de revenu net défini' 
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    // Calculer le revenu net du mois en cours
    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'income',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyExpenses = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyNetIncome = (monthlyIncome[0]?.total || 0) - (monthlyExpenses[0]?.total || 0);

    // Calculer le revenu net de la semaine en cours
    const weeklyIncome = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'income',
          date: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const weeklyExpenses = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'expense',
          date: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const weeklyNetIncome = (weeklyIncome[0]?.total || 0) - (weeklyExpenses[0]?.total || 0);

    let alertCreated = false;
    let alertMessage = '';

    // Vérifier si le plafond mensuel est dépassé
    if (monthlyNetIncome > user.netIncomeCeiling) {
      const existingMonthlyAlert = await Alert.findOne({
        user: req.userId,
        type: 'net_income_ceiling',
        'metadata.period': 'monthly',
        createdAt: { $gte: startOfMonth }
      });

      if (!existingMonthlyAlert) {
        try {
          await createAlertWithEmail({
            userId: req.userId,
            type: 'net_income_ceiling',
            message: `Votre revenu net mensuel (${monthlyNetIncome.toFixed(2)}€) dépasse le plafond défini (${user.netIncomeCeiling}€)`,
            metadata: {
              period: 'monthly',
              netIncome: monthlyNetIncome,
              ceiling: user.netIncomeCeiling,
              income: monthlyIncome[0]?.total || 0,
              expenses: monthlyExpenses[0]?.total || 0
            }
          });
          alertCreated = true;
          alertMessage = 'Alerte mensuelle créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte mensuelle:', error);
        }
      }
    }

    // Vérifier si le plafond hebdomadaire est dépassé (en supposant un plafond hebdomadaire = plafond mensuel / 4)
    const weeklyCeiling = user.netIncomeCeiling / 4;
    if (weeklyNetIncome > weeklyCeiling) {
      const existingWeeklyAlert = await Alert.findOne({
        user: req.userId,
        type: 'net_income_ceiling',
        'metadata.period': 'weekly',
        createdAt: { $gte: startOfWeek }
      });

      if (!existingWeeklyAlert) {
        try {
          await createAlertWithEmail({
            userId: req.userId,
            type: 'net_income_ceiling',
            message: `Votre revenu net hebdomadaire (${weeklyNetIncome.toFixed(2)}€) dépasse le plafond défini (${weeklyCeiling.toFixed(2)}€)`,
            metadata: {
              period: 'weekly',
              netIncome: weeklyNetIncome,
              ceiling: weeklyCeiling,
              income: weeklyIncome[0]?.total || 0,
              expenses: weeklyExpenses[0]?.total || 0
            }
          });
          alertCreated = true;
          alertMessage = alertMessage ? 'Alertes mensuelle et hebdomadaire créées' : 'Alerte hebdomadaire créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte hebdomadaire:', error);
        }
      }
    }

    res.json({
      alert: alertCreated,
      message: alertMessage || 'Aucune alerte nécessaire',
      data: {
        monthly: {
          netIncome: monthlyNetIncome,
          ceiling: user.netIncomeCeiling,
          income: monthlyIncome[0]?.total || 0,
          expenses: monthlyExpenses[0]?.total || 0,
          percentage: user.netIncomeCeiling > 0 ? (monthlyNetIncome / user.netIncomeCeiling) * 100 : 0
        },
        weekly: {
          netIncome: weeklyNetIncome,
          ceiling: weeklyCeiling,
          income: weeklyIncome[0]?.total || 0,
          expenses: weeklyExpenses[0]?.total || 0,
          percentage: weeklyCeiling > 0 ? (weeklyNetIncome / weeklyCeiling) * 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du plafond de revenu net:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier le solde total et créer des alertes si insuffisant
router.post('/check-balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.netIncomeCeiling) {
      return res.json({ 
        alert: false, 
        message: 'Aucun plafond de solde défini' 
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    // Calculer le solde total (toutes les transactions)
    const allTransactions = await Transaction.aggregate([
      {
        $match: {
          user: req.userId
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

    const totalBalance = (allTransactions[0]?.totalIncome || 0) - (allTransactions[0]?.totalExpenses || 0);

    // Calculer le solde du mois en cours
    const monthlyTransactions = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
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

    // Calculer le solde de la semaine en cours
    const weeklyTransactions = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
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

    let alertCreated = false;
    let alertMessage = '';

    // Vérifier si le solde total est inférieur au plafond
    if (totalBalance < user.netIncomeCeiling) {
      const existingTotalAlert = await Alert.findOne({
        user: req.userId,
        type: 'insufficient_balance',
        'metadata.period': 'total',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Dernières 24h
      });

      if (!existingTotalAlert) {
        try {
          const alert = await createAlertWithEmail({
            userId: req.userId,
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
          alertCreated = true;
          alertMessage = 'Alerte solde total insuffisant créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte solde total:', error);
        }
      }
    }

    // Vérifier si le solde mensuel est inférieur au plafond
    if (monthlyBalance < user.netIncomeCeiling) {
      const existingMonthlyAlert = await Alert.findOne({
        user: req.userId,
        type: 'insufficient_balance',
        'metadata.period': 'monthly',
        createdAt: { $gte: startOfMonth }
      });

      if (!existingMonthlyAlert) {
        try {
          const alert = await createAlertWithEmail({
            userId: req.userId,
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
          alertCreated = true;
          alertMessage = alertMessage ? 'Alertes solde total et mensuel insuffisants créées' : 'Alerte solde mensuel insuffisant créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte solde mensuel:', error);
        }
      }
    }

    // Vérifier si le solde hebdomadaire est inférieur au plafond hebdomadaire
    const weeklyCeiling = user.netIncomeCeiling / 4;
    if (weeklyBalance < weeklyCeiling) {
      const existingWeeklyAlert = await Alert.findOne({
        user: req.userId,
        type: 'insufficient_balance',
        'metadata.period': 'weekly',
        createdAt: { $gte: startOfWeek }
      });

      if (!existingWeeklyAlert) {
        try {
          const alert = await createAlertWithEmail({
            userId: req.userId,
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
          alertCreated = true;
          alertMessage = alertMessage ? 'Alertes solde insuffisant créées' : 'Alerte solde hebdomadaire insuffisant créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte solde hebdomadaire:', error);
        }
      }
    }

    res.json({
      alert: alertCreated,
      message: alertMessage || 'Aucune alerte nécessaire',
      data: {
        total: {
          balance: totalBalance,
          ceiling: user.netIncomeCeiling,
          income: allTransactions[0]?.totalIncome || 0,
          expenses: allTransactions[0]?.totalExpenses || 0,
          percentage: user.netIncomeCeiling > 0 ? (totalBalance / user.netIncomeCeiling) * 100 : 0,
          deficit: user.netIncomeCeiling - totalBalance
        },
        monthly: {
          balance: monthlyBalance,
          ceiling: user.netIncomeCeiling,
          income: monthlyTransactions[0]?.totalIncome || 0,
          expenses: monthlyTransactions[0]?.totalExpenses || 0,
          percentage: user.netIncomeCeiling > 0 ? (monthlyBalance / user.netIncomeCeiling) * 100 : 0,
          deficit: user.netIncomeCeiling - monthlyBalance
        },
        weekly: {
          balance: weeklyBalance,
          ceiling: weeklyCeiling,
          income: weeklyTransactions[0]?.totalIncome || 0,
          expenses: weeklyTransactions[0]?.totalExpenses || 0,
          percentage: weeklyCeiling > 0 ? (weeklyBalance / weeklyCeiling) * 100 : 0,
          deficit: weeklyCeiling - weeklyBalance
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du solde:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
