const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const SavingsGoal = require('../models/SavingsGoal');
const auth = require('../middleware/auth');

// Fonction utilitaire pour formater les montants
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Résumé mensuel des finances
router.get('/monthly-summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Revenus et dépenses du mois
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    monthlyStats.forEach(stat => {
      if (stat._id === 'income') {
        monthlyIncome = stat.total;
      } else if (stat._id === 'expense') {
        monthlyExpenses = stat.total;
      }
    });
    
    // Abonnements mensuels
    const monthlySubscriptions = await Subscription.aggregate([
      {
        $match: {
          user: req.userId,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const subscriptionTotal = monthlySubscriptions[0]?.total || 0;
    const subscriptionCount = monthlySubscriptions[0]?.count || 0;
    
    const balance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;
    
    res.json({
      monthlyIncome,
      monthlyExpenses,
      balance,
      savingsRate,
      subscriptionTotal,
      subscriptionCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Objectif d'épargne
router.get('/savings-goal', auth, async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOne({
      user: req.userId,
      isActive: true
    });
    
    if (!savingsGoal) {
      return res.json({
        targetAmount: 0,
        currentAmount: 0,
        progress: 0,
        title: 'Aucun objectif défini'
      });
    }
    
    const progress = savingsGoal.targetAmount > 0 ? 
      (savingsGoal.currentAmount / savingsGoal.targetAmount) * 100 : 0;
    
    res.json({
      targetAmount: savingsGoal.targetAmount,
      currentAmount: savingsGoal.currentAmount,
      progress: Math.min(progress, 100),
      title: savingsGoal.title,
      deadline: savingsGoal.deadline
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Prochains paiements
router.get('/upcoming-payments', auth, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingPayments = await Subscription.find({
      user: req.userId,
      isActive: true,
      nextPaymentDate: { $gte: now, $lte: nextWeek }
    })
    .populate('category', 'name color')
    .sort({ nextPaymentDate: 1 })
    .limit(5);
    
    res.json({ upcomingPayments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Recommandations personnalisées
router.get('/recommendations', auth, async (req, res) => {
  try {
    const recommendations = [];
    
    // Analyser les abonnements pour trouver des économies potentielles
    const subscriptions = await Subscription.find({
      user: req.userId,
      isActive: true
    }).populate('category', 'name');
    
    if (subscriptions.length > 3) {
      const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      recommendations.push({
        id: 1,
        title: "Optimiser vos abonnements",
        description: `Vous avez ${subscriptions.length} abonnements actifs`,
        potential: Math.round(totalSubscriptions * 0.15),
        type: "subscription_optimization"
      });
    }
    
    // Analyser les revenus pour proposer l'épargne automatique
    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'income',
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    if (monthlyIncome[0]?.total > 0) {
      const suggestedSavings = Math.round(monthlyIncome[0].total * 0.10);
      recommendations.push({
        id: 2,
        title: "Épargne automatique",
        description: "Épargnez 10% de vos revenus automatiquement",
        potential: suggestedSavings,
        type: "automatic_savings"
      });
    }
    
    res.json({ recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un objectif d'épargne
router.post('/savings-goal', auth, async (req, res) => {
  try {
    const { title, targetAmount, deadline, description } = req.body;
    
    // Désactiver l'ancien objectif s'il existe
    await SavingsGoal.updateMany(
      { user: req.userId, isActive: true },
      { isActive: false }
    );
    
    const savingsGoal = new SavingsGoal({
      user: req.userId,
      title,
      targetAmount,
      deadline: deadline ? new Date(deadline) : null,
      description,
      currentAmount: 0,
      isActive: true
    });
    
    await savingsGoal.save();
    
    res.status(201).json(savingsGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un objectif d'épargne
router.put('/savings-goal/:id', auth, async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, description } = req.body;
    
    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        title,
        targetAmount,
        currentAmount,
        deadline: deadline ? new Date(deadline) : null,
        description
      },
      { new: true }
    );
    
    if (!savingsGoal) {
      return res.status(404).json({ message: 'Objectif d\'épargne non trouvé' });
    }
    
    res.json(savingsGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un objectif d'épargne
router.delete('/savings-goal/:id', auth, async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!savingsGoal) {
      return res.status(404).json({ message: 'Objectif d\'épargne non trouvé' });
    }
    
    res.json({ message: 'Objectif d\'épargne supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le montant actuel d'un objectif d'épargne
router.patch('/savings-goal/:id/update-amount', auth, async (req, res) => {
  try {
    const { currentAmount } = req.body;
    
    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { currentAmount },
      { new: true }
    );
    
    if (!savingsGoal) {
      return res.status(404).json({ message: 'Objectif d\'épargne non trouvé' });
    }
    
    const progress = savingsGoal.targetAmount > 0 ? 
      (savingsGoal.currentAmount / savingsGoal.targetAmount) * 100 : 0;
    
    res.json({
      ...savingsGoal.toObject(),
      progress: Math.min(progress, 100)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Données enrichies pour Smart Finance
router.get('/smart-finance-data', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Données de base
    const [monthlyStats, subscriptions, savingsGoal, recentTransactions, allTransactions] = await Promise.all([
      // Statistiques mensuelles
      Transaction.aggregate([
        {
          $match: {
            user: req.userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Abonnements actifs
      Subscription.find({
        user: req.userId,
        isActive: true
      }).populate('category', 'name color'),
      
      // Objectif d'épargne actif
      SavingsGoal.findOne({
        user: req.userId,
        isActive: true
      }),
      
      // Transactions récentes (3 derniers mois)
      Transaction.aggregate([
        {
          $match: {
            user: req.userId,
            date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Toutes les transactions pour calculer les moyennes
      Transaction.find({
        user: req.userId
      }).sort({ date: -1 }).limit(100)
    ]);
    
    // Calculer les valeurs de base
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let monthlyIncomeCount = 0;
    let monthlyExpenseCount = 0;
    let isSummaryEstimated = false;
    
    monthlyStats.forEach(stat => {
      if (stat._id === 'income') {
        monthlyIncome = stat.total;
        monthlyIncomeCount = stat.count;
      } else if (stat._id === 'expense') {
        monthlyExpenses = stat.total;
        monthlyExpenseCount = stat.count;
      }
    });
    
    // Calculer les moyennes sur 3 mois
    let avgMonthlyIncome = 0;
    let avgMonthlyExpenses = 0;
    let incomeCount3m = 0;
    let expenseCount3m = 0;
    
    recentTransactions.forEach(stat => {
      if (stat._id === 'income') {
        avgMonthlyIncome = stat.total / 3;
        incomeCount3m = stat.count;
      } else if (stat._id === 'expense') {
        avgMonthlyExpenses = stat.total / 3;
        expenseCount3m = stat.count;
      }
    });

    // Si pas de données pour le mois en cours, utiliser la moyenne des 3 derniers mois
    if (monthlyIncome === 0 && monthlyExpenses === 0 && (avgMonthlyIncome > 0 || avgMonthlyExpenses > 0)) {
        monthlyIncome = avgMonthlyIncome;
        monthlyExpenses = avgMonthlyExpenses;
        monthlyIncomeCount = Math.round(incomeCount3m / 3);
        monthlyExpenseCount = Math.round(expenseCount3m / 3);
        isSummaryEstimated = true;
    }
    
    // Si toujours pas de données, utiliser les moyennes de toutes les transactions
    if (avgMonthlyIncome === 0 && avgMonthlyExpenses === 0 && allTransactions.length > 0) {
      const incomeTransactions = allTransactions.filter(t => t.type === 'income');
      const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
      
      if (incomeTransactions.length > 0) {
        avgMonthlyIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, incomeTransactions.length / 3);
      }
      
      if (expenseTransactions.length > 0) {
        avgMonthlyExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, expenseTransactions.length / 3);
      }
    }
    
    // Si toujours pas de données, utiliser des projections basées sur des moyennes françaises
    if (avgMonthlyIncome === 0 && avgMonthlyExpenses === 0) {
      avgMonthlyIncome = 2500; // Revenu moyen français
      avgMonthlyExpenses = 1800; // Dépenses moyennes françaises
      monthlyIncome = avgMonthlyIncome;
      monthlyExpenses = avgMonthlyExpenses;
      monthlyIncomeCount = 2;
      monthlyExpenseCount = 15;
    }
    
    const balance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (balance / monthlyIncome) * 100 : 0;
    const subscriptionTotal = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const subscriptionCount = subscriptions.length;
    
    // Calculer les projections et recommandations
    const projections = calculateProjections(avgMonthlyIncome, avgMonthlyExpenses, subscriptionTotal);
    const recommendations = generateRecommendations(monthlyIncome, monthlyExpenses, subscriptionCount, subscriptionTotal, savingsRate);
    const insights = generateInsights(monthlyIncome, monthlyExpenses, subscriptionTotal, savingsRate, monthlyIncomeCount, monthlyExpenseCount);
    
    // Objectif d'épargne enrichi
    let enrichedSavingsGoal = null;
    if (savingsGoal) {
      const progress = savingsGoal.targetAmount > 0 ? 
        (savingsGoal.currentAmount / savingsGoal.targetAmount) * 100 : 0;
      
      enrichedSavingsGoal = {
        ...savingsGoal.toObject(),
        progress: Math.min(progress, 100),
        projectedCompletion: calculateProjectedCompletion(savingsGoal, avgMonthlyIncome, avgMonthlyExpenses),
        monthlyContribution: calculateMonthlyContribution(savingsGoal, avgMonthlyIncome, avgMonthlyExpenses)
      };
    }
    
    res.json({
      summary: {
        monthlyIncome,
        monthlyExpenses,
        balance,
        savingsRate,
        subscriptionTotal,
        subscriptionCount,
        monthlyIncomeCount,
        monthlyExpenseCount,
        isSummaryEstimated
      },
      projections,
      recommendations,
      insights,
      savingsGoal: enrichedSavingsGoal,
      subscriptions: subscriptions.slice(0, 5) // Limiter à 5 pour l'affichage
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonctions utilitaires pour les calculs
function calculateProjections(avgIncome, avgExpenses, subscriptionTotal) {
  const discretionaryIncome = avgIncome - avgExpenses;
  const emergencyFund = avgExpenses * 3; // 3 mois de dépenses
  const retirementSavings = avgIncome * 0.15; // 15% des revenus
  const vacationSavings = avgIncome * 0.05; // 5% des revenus
  
  return {
    emergencyFund: {
      target: emergencyFund,
      monthlyContribution: discretionaryIncome * 0.3,
      monthsToComplete: Math.ceil(emergencyFund / (discretionaryIncome * 0.3))
    },
    retirementSavings: {
      target: retirementSavings * 12,
      monthlyContribution: retirementSavings,
      monthsToComplete: 12
    },
    vacationSavings: {
      target: vacationSavings * 12,
      monthlyContribution: vacationSavings,
      monthsToComplete: 12
    },
    discretionaryIncome,
    potentialMonthlySavings: discretionaryIncome * 0.5
  };
}

function generateRecommendations(income, expenses, subscriptionCount, subscriptionTotal, savingsRate) {
  const recommendations = [];
  
  // Si pas de données réelles, fournir des recommandations éducatives
  if (income === 0 && expenses === 0) {
    recommendations.push({
      id: 1,
      title: "Commencer à tracker vos finances",
      description: "Ajoutez vos premières transactions pour obtenir des recommandations personnalisées",
      potential: 500,
      type: "getting_started",
      priority: "high"
    });
    
    recommendations.push({
      id: 2,
      title: "Créer un objectif d'épargne",
      description: "Définissez un objectif d'épargne pour commencer votre voyage financier",
      potential: 300,
      type: "savings_goal",
      priority: "medium"
    });
    
    recommendations.push({
      id: 3,
      title: "Épargne d'urgence recommandée",
      description: "Épargnez 3 mois de dépenses pour les imprévus (estimation: 5400€)",
      potential: 450,
      type: "emergency_fund",
      priority: "high"
    });
    
    return recommendations;
  }
  
  // Recommandation basée sur les abonnements
  if (subscriptionCount > 3) {
    const potentialSavings = Math.round(subscriptionTotal * 0.15);
    recommendations.push({
      id: 1,
      title: "Optimiser vos abonnements",
      description: `Vous avez ${subscriptionCount} abonnements actifs. Réduisez-les de 15% pour économiser`,
      potential: potentialSavings,
      type: "subscription_optimization",
      priority: "high"
    });
  }
  
  // Recommandation basée sur le taux d'épargne
  if (savingsRate < 10) {
    const suggestedSavings = Math.round(income * 0.10);
    recommendations.push({
      id: 2,
      title: "Améliorer votre taux d'épargne",
      description: "Votre taux d'épargne est faible. Épargnez 10% de vos revenus",
      potential: suggestedSavings,
      type: "savings_improvement",
      priority: "high"
    });
  }
  
  // Recommandation pour l'épargne automatique
  if (income > 0) {
    const automaticSavings = Math.round(income * 0.05);
    recommendations.push({
      id: 3,
      title: "Épargne automatique",
      description: "Configurez une épargne automatique de 5% de vos revenus",
      potential: automaticSavings,
      type: "automatic_savings",
      priority: "medium"
    });
  }
  
  // Recommandation pour les dépenses
  if (expenses > income * 0.8) {
    const potentialReduction = Math.round(expenses * 0.1);
    recommendations.push({
      id: 4,
      title: "Réduire vos dépenses",
      description: "Vos dépenses représentent plus de 80% de vos revenus",
      potential: potentialReduction,
      type: "expense_reduction",
      priority: "high"
    });
  }
  
  // Recommandation pour l'épargne d'urgence si pas d'objectif
  if (income > 0 && expenses > 0) {
    const emergencyFund = expenses * 3;
    const monthlyContribution = Math.round(emergencyFund / 12);
    recommendations.push({
      id: 5,
      title: "Créer un fonds d'urgence",
      description: `Épargnez ${formatCurrency(emergencyFund)} pour 3 mois de dépenses`,
      potential: monthlyContribution,
      type: "emergency_fund",
      priority: "high"
    });
  }
  
  return recommendations.slice(0, 4); // Limiter à 4 recommandations
}

function generateInsights(income, expenses, subscriptionTotal, savingsRate, incomeCount, expenseCount) {
  const insights = [];
  
  // Si pas de données réelles, fournir des insights éducatifs
  if (income === 0 && expenses === 0) {
    insights.push({
      type: "getting_started",
      title: "Bienvenue dans votre gestionnaire financier !",
      message: "Commencez par ajouter vos premières transactions pour obtenir des insights personnalisés.",
      icon: "trending-up",
      color: "blue"
    });
    
    insights.push({
      type: "education",
      title: "Conseil financier",
      message: "L'épargne d'urgence devrait représenter 3 à 6 mois de vos dépenses mensuelles.",
      icon: "piggy-bank",
      color: "green"
    });
    
    return insights;
  }
  
  if (income > 0) {
    // Insight sur les revenus
    if (incomeCount === 1) {
      insights.push({
        type: "income",
        title: "Revenu unique",
        message: "Vous avez un seul revenu ce mois-ci. Diversifiez vos sources de revenus pour plus de sécurité.",
        icon: "trending-up",
        color: "green"
      });
    }
    
    // Insight sur les dépenses
    if (expenseCount > 10) {
      insights.push({
        type: "expenses",
        title: "Nombreuses transactions",
        message: `${expenseCount} dépenses ce mois-ci. Regroupez vos achats pour mieux contrôler vos dépenses.`,
        icon: "receipt",
        color: "orange"
      });
    }
    
    // Insight sur les abonnements
    if (subscriptionTotal > income * 0.2) {
      insights.push({
        type: "subscriptions",
        title: "Abonnements coûteux",
        message: `Vos abonnements représentent ${Math.round((subscriptionTotal / income) * 100)}% de vos revenus.`,
        icon: "calendar",
        color: "red"
      });
    }
    
    // Insight sur l'épargne
    if (savingsRate >= 20) {
      insights.push({
        type: "savings",
        title: "Excellent taux d'épargne",
        message: `Félicitations ! Vous épargnez ${savingsRate.toFixed(1)}% de vos revenus.`,
        icon: "piggy-bank",
        color: "green"
      });
    } else if (savingsRate < 5) {
      insights.push({
        type: "savings",
        title: "Taux d'épargne faible",
        message: `Votre taux d'épargne de ${savingsRate.toFixed(1)}% peut être amélioré.`,
        icon: "alert-triangle",
        color: "yellow"
      });
    }
    
    // Insight sur l'équilibre revenus/dépenses
    if (expenses > income) {
      insights.push({
        type: "balance",
        title: "Dépenses supérieures aux revenus",
        message: "Vos dépenses dépassent vos revenus. Réduisez vos dépenses ou augmentez vos revenus.",
        icon: "alert-triangle",
        color: "red"
      });
    } else if (income - expenses > income * 0.3) {
      insights.push({
        type: "balance",
        title: "Excellent équilibre financier",
        message: "Vous dégagez un bon surplus. Pensez à l'investir ou à l'épargner.",
        icon: "trending-up",
        color: "green"
      });
    }
  }
  
  return insights.slice(0, 3); // Limiter à 3 insights
}

function calculateProjectedCompletion(savingsGoal, avgIncome, avgExpenses) {
  if (!savingsGoal || savingsGoal.targetAmount <= savingsGoal.currentAmount) {
    return null;
  }
  
  const remaining = savingsGoal.targetAmount - savingsGoal.currentAmount;
  const discretionaryIncome = avgIncome - avgExpenses;
  const monthlyContribution = discretionaryIncome * 0.3; // 30% du revenu discrétionnaire
  
  if (monthlyContribution <= 0) {
    return { months: null, message: "Revenus insuffisants pour épargner" };
  }
  
  const months = Math.ceil(remaining / monthlyContribution);
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + months);
  
  return {
    months,
    completionDate,
    monthlyContribution,
    message: months <= 12 ? 
      `Objectif atteignable en ${months} mois` : 
      `Objectif atteignable en ${Math.round(months / 12)} ans`
  };
}

function calculateMonthlyContribution(savingsGoal, avgIncome, avgExpenses) {
  if (!savingsGoal || savingsGoal.targetAmount <= savingsGoal.currentAmount) {
    return 0;
  }
  
  const discretionaryIncome = avgIncome - avgExpenses;
  return Math.min(discretionaryIncome * 0.3, (savingsGoal.targetAmount - savingsGoal.currentAmount) / 12);
}

module.exports = router;
