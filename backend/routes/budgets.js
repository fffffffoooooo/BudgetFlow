
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Récupérer tous les budgets de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.userId })
      .populate('category', 'name color');
    res.json({ budgets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un nouveau budget
router.post('/', auth, async (req, res) => {
  try {
    const { categoryId, amount, period } = req.body;
    
    // Vérifier si la catégorie existe
    const category = await Category.findOne({
      _id: categoryId,
      user: req.userId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Vérifier si un budget pour cette catégorie existe déjà
    const existingBudget = await Budget.findOne({
      category: categoryId,
      user: req.userId
    });
    
    if (existingBudget) {
      return res.status(400).json({
        message: 'Un budget pour cette catégorie existe déjà'
      });
    }
    
    const budget = new Budget({
      user: req.userId,
      category: categoryId,
      amount,
      period: period || 'monthly'
    });
    
    await budget.save();
    
    res.status(201).json({
      budget: await budget.populate('category', 'name color')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un budget
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, period } = req.body;
    
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget non trouvé' });
    }
    
    // Mise à jour des champs
    if (amount !== undefined) budget.amount = amount;
    if (period) budget.period = period;
    
    await budget.save();
    
    res.json({
      budget: await budget.populate('category', 'name color')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un budget
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget non trouvé' });
    }
    
    res.json({ message: 'Budget supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
