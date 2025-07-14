const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const SavingsGoal = require('../models/SavingsGoal');
const auth = require('../middleware/auth');
const { defaultCategories } = require('../utils/categoryDefaults');
const { sendAlertEmail } = require('../services/alertService');
const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');

// Clé secrète pour les JWT (à changer en production et stocker dans .env)
const JWT_SECRET = 'your_jwt_secret_key';

// Fonction pour créer les catégories par défaut
const createDefaultCategories = async (userId) => {
  try {
    const categories = defaultCategories.map(cat => ({
      ...cat,
      user: userId
    }));
    
    await Category.insertMany(categories);
    console.log('Catégories par défaut créées pour l\'utilisateur:', userId);
  } catch (error) {
    console.error('Erreur lors de la création des catégories par défaut:', error);
  }
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Vérifier si l'email existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer un nouvel utilisateur
    user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    
    // Créer les catégories par défaut
    await createDefaultCategories(user._id);
    
    // Créer un objectif d'épargne par défaut
    const defaultSavingsGoal = new SavingsGoal({
      user: user._id,
      title: 'Objectif d\'épargne',
      targetAmount: 5000,
      currentAmount: 0
    });
    await defaultSavingsGoal.save();
    
    // Créer un token JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        alertEmail: user.alertEmail || '',
        netIncomeCeiling: user.netIncomeCeiling ?? null,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Créer un token JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        alertEmail: user.alertEmail || '',
        netIncomeCeiling: user.netIncomeCeiling ?? null,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Profil utilisateur détaillé
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Statistiques utilisateur
    const stats = await Promise.all([
      Category.countDocuments({ user: req.userId }),
      Transaction.countDocuments({ user: req.userId }),
      Alert.countDocuments({ user: req.userId, read: false })
    ]);
    
    res.json({ 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        alertEmail: user.alertEmail || '',
        netIncomeCeiling: user.netIncomeCeiling ?? null,
        stats: {
          categoriesCount: stats[0],
          transactionsCount: stats[1],
          unreadAlertsCount: stats[2]
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mise à jour du profil
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, password, alertEmail, netIncomeCeiling } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (alertEmail !== undefined) updateData.alertEmail = alertEmail;
    if (netIncomeCeiling !== undefined) updateData.netIncomeCeiling = netIncomeCeiling;
    
    let user = await User.findById(req.userId);
    
    if (password) {
      user.password = password;
      await user.save();
    }
    
    user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Suppression du compte
router.delete('/profile', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route admin pour récupérer tous les utilisateurs
const requireAdmin = require('../middleware/requireAdmin');
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'name email alertEmail role');
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajout/MAJ du plafond de revenu net
router.put('/me', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (req.body.netIncomeCeiling !== undefined) {
      user.netIncomeCeiling = req.body.netIncomeCeiling;
    }
    // ... autres champs modifiables ...
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Vérifier le plafond de revenu net
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

    // Calculer le revenu net mensuel
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

    const monthlyNetIncome = (monthlyTransactions[0]?.totalIncome || 0) - (monthlyTransactions[0]?.totalExpenses || 0);
    const monthlyIncome = monthlyTransactions[0]?.totalIncome || 0;
    const monthlyExpenses = monthlyTransactions[0]?.totalExpenses || 0;

    // Calculer le revenu net hebdomadaire
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

    const weeklyNetIncome = (weeklyTransactions[0]?.totalIncome || 0) - (weeklyTransactions[0]?.totalExpenses || 0);
    const weeklyIncome = weeklyTransactions[0]?.totalIncome || 0;
    const weeklyExpenses = weeklyTransactions[0]?.totalExpenses || 0;

    // Calculer le revenu net total
    const allTransactions = await Transaction.aggregate([
      {
        $match: { user: req.userId }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }
        }
      }
    ]);

    const totalNetIncome = (allTransactions[0]?.totalIncome || 0) - (allTransactions[0]?.totalExpenses || 0);
    const totalIncome = allTransactions[0]?.totalIncome || 0;
    const totalExpenses = allTransactions[0]?.totalExpenses || 0;

    let alertCreated = false;
    let alertMessage = '';

    // Vérifier si le revenu net mensuel dépasse le plafond
    if (monthlyNetIncome > user.netIncomeCeiling) {
      const existingMonthlyAlert = await Alert.findOne({
        user: req.userId,
        type: 'net_income_ceiling',
        'metadata.period': 'monthly',
        createdAt: { $gte: startOfMonth }
      });

      if (!existingMonthlyAlert) {
        try {
          const alert = await createAlertWithEmail({
            userId: req.userId,
            type: 'net_income_ceiling',
            message: `Votre revenu net mensuel (${monthlyNetIncome.toFixed(2)}€) dépasse le plafond défini (${user.netIncomeCeiling}€)`,
            metadata: {
              period: 'monthly',
              ceiling: user.netIncomeCeiling,
              reachedAmount: monthlyNetIncome,
              percentage: (monthlyNetIncome / user.netIncomeCeiling) * 100,
              income: monthlyIncome,
              expenses: monthlyExpenses
            }
          });
          alertCreated = true;
          alertMessage = 'Alerte revenu net mensuel créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte revenu net mensuel:', error);
        }
      }
    }

    // Vérifier si le revenu net hebdomadaire dépasse le plafond hebdomadaire
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
          const alert = await createAlertWithEmail({
            userId: req.userId,
            type: 'net_income_ceiling',
            message: `Votre revenu net hebdomadaire (${weeklyNetIncome.toFixed(2)}€) dépasse le plafond défini (${weeklyCeiling.toFixed(2)}€)`,
            metadata: {
              period: 'weekly',
              ceiling: weeklyCeiling,
              reachedAmount: weeklyNetIncome,
              percentage: (weeklyNetIncome / weeklyCeiling) * 100,
              income: weeklyIncome,
              expenses: weeklyExpenses
            }
          });
          alertCreated = true;
          alertMessage = alertMessage ? 'Alertes revenu net créées' : 'Alerte revenu net hebdomadaire créée';
        } catch (error) {
          console.error('Erreur lors de la création de l\'alerte revenu net hebdomadaire:', error);
        }
      }
    }

    res.json({
      alert: alertCreated,
      message: alertMessage || 'Aucune alerte nécessaire',
      data: {
        total: {
          netIncome: totalNetIncome,
          ceiling: user.netIncomeCeiling,
          income: totalIncome,
          expenses: totalExpenses,
          percentage: user.netIncomeCeiling > 0 ? (totalNetIncome / user.netIncomeCeiling) * 100 : 0
        },
        monthly: {
          netIncome: monthlyNetIncome,
          ceiling: user.netIncomeCeiling,
          income: monthlyIncome,
          expenses: monthlyExpenses,
          percentage: user.netIncomeCeiling > 0 ? (monthlyNetIncome / user.netIncomeCeiling) * 100 : 0
        },
        weekly: {
          netIncome: weeklyNetIncome,
          ceiling: weeklyCeiling,
          income: weeklyIncome,
          expenses: weeklyExpenses,
          percentage: weeklyCeiling > 0 ? (weeklyNetIncome / weeklyCeiling) * 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du plafond de revenu net:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
