
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const CategorySpending = require('../models/CategorySpending');
const auth = require('../middleware/auth');
const { checkBudgetLimits, checkUnusualExpenses } = require('../utils/alertUtils');
const { updateCategorySpending, checkAndResetMonthlySpending } = require('../utils/categorySpendingUtils');
const User = require('../models/User');
const { sendMail } = require('../utils/emailSender');
const { transactionAlertEmail, deletionAlertEmail } = require('../utils/emailTemplates');

// Récupérer toutes les transactions de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si nous sommes au début du mois et réinitialiser les dépenses si nécessaire
    await checkAndResetMonthlySpending(req.userId);
    const { startDate, endDate, categoryId, search, type, minAmount, maxAmount } = req.query;
    
    console.log(`GET /transactions - Filtres: startDate=${startDate}, endDate=${endDate}, categoryId=${categoryId}, search=${search}, type=${type}, minAmount=${minAmount}, maxAmount=${maxAmount}`);
    
    let query = { user: req.userId };
    
    if (startDate && endDate) {
      // Assurer que les dates sont bien formatées pour MongoDB
      const start = new Date(startDate);
      // Ajouter un jour à la date de fin pour inclure les transactions de ce jour
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
      console.log('Filtrage par date:', { start, end });
    }
    
    if (categoryId) {
      query.category = categoryId;
    }
    
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }
    
    // Ajout du filtre par type (expense/income)
    if (type && type !== 'all') {
      query.type = type;
      console.log('Filtrage par type:', type);
    }
    
    // Filtrage par montant
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    
    const transactions = await Transaction.find(query)
      .populate('category', 'name color')
      .sort({ date: -1 });
      
    console.log(`Transactions trouvées: ${transactions.length}`);
    res.json({ transactions });
  } catch (error) {
    console.error("Erreur GET /transactions:", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer une transaction par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('category', 'name color');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    
    res.json({ transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;
    
    console.log('POST /transactions - Données reçues:', req.body);
    
    // Vérifier que la catégorie existe et appartient à l'utilisateur
    const existingCategory = await Category.findOne({
      _id: category,
      user: req.userId
    });
    
    if (!existingCategory) {
      console.log(`Catégorie non trouvée: ${category} pour l'utilisateur: ${req.userId}`);
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Créer la nouvelle transaction
    const transaction = new Transaction({
      user: req.userId,
      amount: Math.abs(amount), // Stocker en valeur absolue
      type, // expense ou income
      category,
      description,
      date: date || Date.now()
    });
    
    await transaction.save();
    console.log('Transaction créée avec succès:', transaction);
    
    // Mettre à jour les dépenses de la catégorie pour ce mois
    try {
      // Pour les dépenses, nous utilisons une valeur positive pour incrémenter le compteur
      // Pour les revenus, nous n'affectons pas les dépenses de catégorie
      if (type === 'expense') {
        await updateCategorySpending(req.userId, category, Math.abs(amount), transaction.date);
        console.log(`Dépenses de la catégorie ${category} mises à jour`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des dépenses de catégorie:', error);
      // Ne pas bloquer la création de la transaction si la mise à jour échoue
    }
    
    // Vérifier les dépassements de plafond et les dépenses inhabituelles
    if (type === 'expense') {
      try {
        await checkBudgetLimits(req.userId, category);
        await checkUnusualExpenses(req.userId, transaction);
      } catch (alertError) {
        console.error("Erreur lors de la vérification des alertes:", alertError);
        // Ne pas bloquer la création de la transaction même si la vérification d'alerte échoue
      }
    }
    
    // Envoi d'une notification e-mail à la création de la transaction
    try {
      const user = await User.findById(req.userId);
      const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
      const cat = await Category.findById(transaction.category);
      const icon = type === 'income' ? '📈' : '💸';
      const html = transactionAlertEmail({
        icon: type === 'expense' ? '💸' : '📈',
        amount: `${amount.toFixed(2)} €`,
        type: type === 'expense' ? 'Dépense' : 'Revenu',
        category: existingCategory.name,
        date: new Date(transaction.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        description,
        link: 'https://budgetflow.app/transactions'
      });
      await sendMail({
        to: recipientEmail,
        subject: `${icon} Nouvelle ${type === 'income' ? 'entrée' : 'dépense'} enregistrée - BABOS`,
        html
      });
    } catch (mailErr) {
      console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de création de transaction:', mailErr);
    }

    // Récupérer la transaction avec la catégorie peuplée pour la réponse
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('category', 'name color');
    
    res.status(201).json({
      transaction: populatedTransaction
    });
  } catch (error) {
    console.error('Erreur serveur lors de la création de transaction:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour une transaction
router.put('/:id', auth, async (req, res) => {
  try {
    const { amount, category: categoryId, description, date } = req.body;
    
    console.log(`PUT /transactions/${req.params.id} - Données:`, req.body);
    
    // Vérifier que la transaction existe et appartient à l'utilisateur
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    
    // Mise à jour des champs
    const updates = {};
    
    if (amount !== undefined) updates.amount = Math.abs(amount);
    if (description) updates.description = description;
    if (date) updates.date = date;
    
    if (categoryId) {
      // Vérifier que la nouvelle catégorie existe et appartient à l'utilisateur
      const category = await Category.findOne({
        _id: categoryId,
        user: req.userId
      });
      
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      
      updates.category = categoryId;
    }
    
    // Sauvegarde de la transaction originale pour comparer les changements
    const originalAmount = transaction.amount;
    const originalCategory = transaction.category;
    
    // Mise à jour de la transaction
    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('category', 'name color');
    
    console.log('Transaction mise à jour:', transaction);
    
    // Mettre à jour les dépenses de catégorie si nécessaire
    if (transaction.type === 'expense') {
      try {
        // Si la catégorie a changé, nous devons ajuster les deux catégories
        if (updates.category && originalCategory.toString() !== updates.category) {
          // Soustraire le montant de l'ancienne catégorie
          await updateCategorySpending(req.userId, originalCategory, -originalAmount, transaction.date);
          // Ajouter le montant à la nouvelle catégorie
          await updateCategorySpending(req.userId, updates.category, Math.abs(transaction.amount), transaction.date);
        } 
        // Si seulement le montant a changé
        else if (updates.amount && originalAmount !== updates.amount) {
          // Recalculer la différence et mettre à jour
          const difference = Math.abs(updates.amount) - originalAmount;
          await updateCategorySpending(req.userId, transaction.category, difference, transaction.date);
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour des dépenses de catégorie:', error);
      }
    }
    
    // Vérifier les dépassements de plafond si c'est une dépense
    if (transaction.type === 'expense') {
      try {
        await checkBudgetLimits(req.userId, transaction.category);
      } catch (alertError) {
        console.error("Erreur lors de la vérification des alertes:", alertError);
      }
    }
    
    res.json({ transaction });
  } catch (error) {
    console.error('Erreur serveur lors de la mise à jour de transaction:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`DELETE /transactions/${req.params.id}`);
    
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction non trouvée' });
    }
    
    // Si c'est une dépense, soustraire le montant des dépenses de la catégorie
    if (transaction.type === 'expense') {
      try {
        // Nous utilisons une valeur négative pour soustraire le montant
        await updateCategorySpending(req.userId, transaction.category, -transaction.amount, transaction.date);
        console.log(`Dépenses de la catégorie ${transaction.category} mises à jour après suppression`);
      } catch (error) {
        console.error('Erreur lors de la mise à jour des dépenses de catégorie après suppression:', error);
      }
    }
    
    console.log('Transaction supprimée:', transaction._id);

    // Envoi d'un e-mail de notification de suppression
    try {
      const user = await User.findById(req.userId);
      const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
      const cat = await Category.findById(transaction.category);
      const icon = transaction.type === 'income' ? '📈' : '💸';
      const html = deletionAlertEmail({
        icon,
        amount: transaction.amount + '€',
        type: transaction.type === 'income' ? 'Revenu' : 'Dépense',
        category: cat ? cat.name : 'Inconnue',
        date: (transaction.date && new Date(transaction.date).toLocaleDateString()) || 'N/A',
        description: transaction.description || ''
      });
      await sendMail({
        to: recipientEmail,
        subject: `${icon} Transaction supprimée - BABOS`,
        html
      });
    } catch (mailErr) {
      console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de suppression de transaction:', mailErr);
    }

    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur serveur lors de la suppression de transaction:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
