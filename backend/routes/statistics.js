
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Point d'entrée principal pour les statistiques - répond aux différents types de requêtes
router.get('/', auth, async (req, res) => {
  try {
    const { type, year, month, category } = req.query;
    let data = {};
    
    console.log(`Requête de statistiques reçue - Type: ${type}, Année: ${year}, Mois: ${month}, Catégorie: ${category}`);
    
    if (type === 'monthly') {
      // Statistiques mensuelles (par jour)
      const selectedYear = parseInt(year) || new Date().getFullYear();
      const selectedMonth = parseInt(month) || new Date().getMonth();
      
      data = await getMonthlyStats(req.userId, selectedYear, selectedMonth, category);
    } 
    else if (type === 'weekly') {
      // Statistiques hebdomadaires (par jour de la semaine)
      data = await getWeeklyStats(req.userId, category);
    } 
    else if (type === 'yearly') {
      // Statistiques annuelles (par mois)
      const selectedYear = parseInt(year) || new Date().getFullYear();
      
      data = await getYearlyStats(req.userId, selectedYear, category);
    }
    
    console.log(`Données statistiques générées:`, data);
    res.json({ data });
  } catch (error) {
    console.error('Erreur lors de la génération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Statistiques mensuelles améliorées
async function getMonthlyStats(userId, year, month, categoryId) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  let matchQuery = {
    user: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (categoryId && categoryId !== 'all') {
    matchQuery.category = new mongoose.Types.ObjectId(categoryId);
  }
  
  // Agrégation pour obtenir les revenus et dépenses par jour
  const dailyStats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { 
          day: { $dayOfMonth: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.day': 1 } }
  ]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const incomeEntry = dailyStats.find(item => item._id.day === day && item._id.type === 'income');
    const expenseEntry = dailyStats.find(item => item._id.day === day && item._id.type === 'expense');
    
    result.push({
      name: String(day),
      income: incomeEntry ? incomeEntry.total : 0,
      expenses: expenseEntry ? expenseEntry.total : 0
    });
  }
  
  return result;
}

// Statistiques hebdomadaires améliorées avec calculs dynamiques
async function getWeeklyStats(userId, categoryId) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Dimanche de cette semaine
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  let matchQuery = {
    user: new mongoose.Types.ObjectId(userId),
    type: 'expense',
    date: { $gte: startOfWeek, $lte: endOfWeek }
  };
  
  if (categoryId && categoryId !== 'all') {
    matchQuery.category = new mongoose.Types.ObjectId(categoryId);
  }
  
  // Agrégation pour obtenir les dépenses par jour de la semaine
  const expenses = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Conversion en format attendu par le frontend
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const result = {};
  
  // Initialiser tous les jours à 0
  days.forEach(day => {
    result[day] = 0;
  });
  
  // Remplir avec les vraies données
  expenses.forEach(item => {
    const dayIndex = item._id - 1;
    if (dayIndex >= 0 && dayIndex < 7) {
      result[days[dayIndex]] = item.total;
    }
  });
  
  return result;
}

// Statistiques annuelles améliorées
async function getYearlyStats(userId, year, categoryId) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  
  let matchQuery = {
    user: new mongoose.Types.ObjectId(userId),
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (categoryId && categoryId !== 'all') {
    matchQuery.category = new mongoose.Types.ObjectId(categoryId);
  }
  
  // Agrégation pour obtenir les données par mois et type
  const monthlyStats = await Transaction.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { 
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.month': 1 } }
  ]);
  
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const result = [];
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = i + 1;
    
    const incomeEntry = monthlyStats.find(item => item._id.month === monthIndex && item._id.type === 'income');
    const expenseEntry = monthlyStats.find(item => item._id.month === monthIndex && item._id.type === 'expense');
    
    result.push({
      name: monthNames[i],
      income: incomeEntry ? incomeEntry.total : 0,
      expenses: expenseEntry ? expenseEntry.total : 0
    });
  }
  
  return result;
}

// Statistiques par catégorie dynamiques
router.get('/by-category', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'expense',
          date: dateFilter
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          color: { $first: '$categoryInfo.color' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json({ data: categoryStats });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques par catégorie:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour obtenir un résumé des statistiques (pour le tableau de bord)
router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Calcul parallèle pour optimiser les performances
    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            type: 'income',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);
    
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
    
    res.json({
      totalIncome,
      totalExpense
    });
  } catch (error) {
    console.error('Erreur lors du calcul du résumé:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour obtenir les sources de revenus dynamiques
router.get('/income-sources', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    } else {
      const now = new Date();
      dateFilter = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    
    const incomeSources = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.userId),
          type: 'income',
          date: dateFilter
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          color: { $first: '$categoryInfo.color' },
          value: { $sum: '$amount' }
        }
      },
      { $sort: { value: -1 } }
    ]);
    
    res.json({ data: incomeSources });
  } catch (error) {
    console.error('Erreur lors du calcul des sources de revenus:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour les analyses avancées et métriques
router.get('/advanced-metrics', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Calculs avancés en parallèle
    const [
      totalStats,
      categoryBreakdown,
      dailyAverage,
      topExpenseCategories
    ] = await Promise.all([
      // Stats totales
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]),
      
      // Répartition par catégorie
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $group: {
            _id: {
              categoryId: '$category',
              type: '$type'
            },
            name: { $first: '$categoryInfo.name' },
            color: { $first: '$categoryInfo.color' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Moyenne quotidienne
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              day: { $dayOfYear: '$date' },
              type: '$type'
            },
            dailyTotal: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: '$_id.type',
            avgDaily: { $avg: '$dailyTotal' }
          }
        }
      ]),
      
      // Top 5 des catégories de dépenses
      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(req.userId),
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        { $unwind: '$categoryInfo' },
        {
          $group: {
            _id: '$category',
            name: { $first: '$categoryInfo.name' },
            color: { $first: '$categoryInfo.color' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      totalStats,
      categoryBreakdown,
      dailyAverage,
      topExpenseCategories,
      period,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Erreur lors du calcul des métriques avancées:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
