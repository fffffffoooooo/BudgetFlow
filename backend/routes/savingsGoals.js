const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');

// Obtenir tous les objectifs d'épargne de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({ user: req.userId, isActive: true })
      .sort({ priority: -1, createdAt: -1 });

    // Calculer le montant actuel basé sur les transactions
    const transactions = await Transaction.aggregate([
      {
        $match: {
          user: req.userId,
          type: 'income'
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    const totalIncome = transactions[0]?.totalIncome || 0;

    // Mettre à jour le montant actuel de chaque objectif
    for (let goal of savingsGoals) {
      // Calculer le montant actuel basé sur les revenus (simulation d'épargne)
      // Dans un vrai système, on aurait des transactions d'épargne séparées
      const currentAmount = Math.min(totalIncome * 0.2, goal.targetAmount); // 20% des revenus
      goal.currentAmount = currentAmount;
      goal.updateSuggestedContribution();
      await goal.save();
    }

    res.json({ savingsGoals });
  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs d\'épargne:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouvel objectif d'épargne
router.post('/', auth, async (req, res) => {
  try {
    const { name, targetAmount, targetDate, category, priority, monthlyContribution } = req.body;

    const savingsGoal = new SavingsGoal({
      user: req.userId,
      name: name || 'Objectif d\'épargne',
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : null,
      category: category || 'other',
      priority: priority || 'medium',
      monthlyContribution: monthlyContribution || 0
    });

    await savingsGoal.save();
    res.status(201).json({ savingsGoal });
  } catch (error) {
    console.error('Erreur lors de la création de l\'objectif d\'épargne:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un objectif d'épargne
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, targetAmount, targetDate, category, priority, monthlyContribution, currentAmount } = req.body;

    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      {
        name,
        targetAmount,
        targetDate: targetDate ? new Date(targetDate) : null,
        category,
        priority,
        monthlyContribution,
        currentAmount,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Objectif d\'épargne non trouvé' });
    }

    res.json({ savingsGoal });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'objectif d\'épargne:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un objectif d'épargne
router.delete('/:id', auth, async (req, res) => {
  try {
    const savingsGoal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!savingsGoal) {
      return res.status(404).json({ message: 'Objectif d\'épargne non trouvé' });
    }

    res.json({ message: 'Objectif d\'épargne supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'objectif d\'épargne:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les statistiques d'épargne
router.get('/stats', auth, async (req, res) => {
  try {
    const savingsGoals = await SavingsGoal.find({ user: req.userId, isActive: true });
    
    // Calculer les statistiques
    const totalTarget = savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrent = savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    const totalRemaining = Math.max(totalTarget - totalCurrent, 0);

    // Calculer la contribution mensuelle totale
    const totalMonthlyContribution = savingsGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);
    const totalSuggestedContribution = savingsGoals.reduce((sum, goal) => sum + goal.suggestedContribution, 0);

    res.json({
      stats: {
        totalGoals: savingsGoals.length,
        totalTarget,
        totalCurrent,
        totalProgress,
        totalRemaining,
        totalMonthlyContribution,
        totalSuggestedContribution
      },
      goals: savingsGoals
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'épargne:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router; 