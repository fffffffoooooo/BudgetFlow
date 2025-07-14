const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const CategorySpending = require('../models/CategorySpending');
const auth = require('../middleware/auth');
const { resetCategorySpending, checkAndResetMonthlySpending } = require('../utils/categorySpendingUtils');
const User = require('../models/User');
const { sendMail } = require('../utils/emailSender');
const { categoryCreatedEmail } = require('../utils/emailTemplates');

// Récupérer toutes les catégories de l'utilisateur
router.get('/', auth, async (req, res) => {
  try {
    // Vérifier si nous sommes au début du mois et réinitialiser les dépenses si nécessaire
    await checkAndResetMonthlySpending(req.userId);
    const categories = await Category.find({ user: req.userId });
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer une catégorie par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json({ category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle catégorie
router.post(
  '/',
  auth,
  [
    body('name', 'Le nom de la catégorie est requis').not().isEmpty(),
    body('color', 'La couleur doit être un code hexadécimal valide').optional().isHexColor(),
    body('limit', 'La limite doit être un nombre').optional().isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, color, limit } = req.body;
      
      const category = new Category({
        user: req.userId,
        name,
        color,
        limit: limit || 0
      });
      
      await category.save();

      // Envoi d'une notification e-mail à la création de la catégorie
      try {
        const user = await User.findById(req.userId);
        const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
        const subject = `Nouvelle catégorie créée - BudgetFlow`;
        const html = categoryCreatedEmail({
          category: category.name,
          limit: category.limit,
          description: category.description,
          date: new Date(category.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        });
        await sendMail({
          to: recipientEmail,
          subject,
          html
        });
      } catch (mailErr) {
        console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de création de catégorie:', mailErr);
      }

      res.status(201).json({ category });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Mettre à jour une catégorie
router.put(
  '/:id',
  auth,
  [
    body('name', 'Le nom de la catégorie est requis').optional().not().isEmpty(),
    body('color', 'La couleur doit être un code hexadécimal valide').optional().isHexColor(),
    body('limit', 'La limite doit être un nombre').optional().isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, color, limit } = req.body;
      
      let category = await Category.findOne({
        _id: req.params.id,
        user: req.userId
      });
      
      if (!category) {
        return res.status(404).json({ message: 'Catégorie non trouvée' });
      }
      
      // Mise à jour des champs
      if (name) category.name = name;
      if (color) category.color = color;
      if (limit !== undefined) category.limit = limit;
      
      await category.save();
      
      res.json({ category });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// Supprimer une catégorie
router.delete('/:id', auth, async (req, res) => {
  try {
    // Vérifier s'il y a des transactions associées à cette catégorie
    const transactionsCount = await Transaction.countDocuments({
      category: req.params.id
    });
    
    if (transactionsCount > 0) {
      return res.status(400).json({
        message: 'Impossible de supprimer cette catégorie car elle est associée à des transactions'
      });
    }
    
    // Supprimer les budgets associés
    await Budget.deleteMany({ category: req.params.id });
    
    // Supprimer la catégorie
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    // Envoi d'un email de notification de suppression
    try {
      const user = await User.findById(req.userId);
      const recipientEmail = user.alertEmail && user.alertEmail.trim() !== '' ? user.alertEmail : user.email;
      const subject = `Catégorie supprimée - BudgetFlow`;
      const html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 0; margin: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.10);">
          <tr style="background: #e53935; color: #fff;">
            <td style="padding: 18px 32px; font-size: 1.5rem; font-weight: bold; letter-spacing: 1px;">
              ❌ Catégorie supprimée
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin-top: 0; color: #e53935;">La catégorie <b>${category.name}</b> a été supprimée</h2>
              <ul style="padding-left:1em;">
                <li>Nom : <b>${category.name}</b></li>
                <li>Plafond budgétaire : <b>${category.limit || 'Aucun'}</b></li>
              </ul>
              <p style="color:#e53935; font-weight:bold;">Cette catégorie n'est plus disponible pour vos transactions.</p>
            </td>
          </tr>
          <tr>
            <td style="background: #f6f8fa; color: #888; font-size: 0.95rem; padding: 16px 32px; text-align: center;">
              Cet email est envoyé automatiquement par BudgetFlow – ne pas répondre.
            </td>
          </tr>
        </table>
      </div>`;
      await sendMail({
        to: recipientEmail,
        subject,
        html
      });
    } catch (mailErr) {
      console.error('[ALERT][EMAIL] Erreur lors de l\'envoi de l\'email de suppression de catégorie:', mailErr);
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les dépenses mensuelles pour toutes les catégories
router.get('/spending', auth, async (req, res) => {
  try {
    // Vérifier si nous sommes au début du mois et réinitialiser les dépenses si nécessaire
    await checkAndResetMonthlySpending(req.userId);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Récupérer toutes les catégories de l'utilisateur
    const categories = await Category.find({ user: req.userId });
    
    // Récupérer les dépenses de ces catégories pour ce mois
    const categorySpending = await CategorySpending.find({
      user: req.userId,
      month: currentMonth,
      year: currentYear
    }).populate('category', 'name color');
    
    // Combiner les données
    const result = categories.map(category => {
      // Trouver les dépenses correspondantes
      const spending = categorySpending.find(cs => 
        cs.category && cs.category._id.toString() === category._id.toString()
      );
      
      return {
        _id: category._id,
        name: category.name,
        color: category.color,
        limit: category.limit,
        spending: spending ? spending.amount : 0
      };
    });
    
    res.json({ categorySpending: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Réinitialiser manuellement les dépenses d'une catégorie
router.post('/:id/reset-spending', auth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Vérifier si la catégorie existe et appartient à l'utilisateur
    const category = await Category.findOne({
      _id: categoryId,
      user: req.userId
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    // Réinitialiser les dépenses pour cette catégorie
    await resetCategorySpending(req.userId, categoryId);
    
    res.json({ message: 'Dépenses de la catégorie réinitialisées avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Réinitialiser manuellement les dépenses de toutes les catégories
router.post('/reset-all-spending', auth, async (req, res) => {
  try {
    // Récupérer toutes les catégories de l'utilisateur
    const categories = await Category.find({ user: req.userId });
    
    // Réinitialiser les dépenses pour chaque catégorie
    for (const category of categories) {
      await resetCategorySpending(req.userId, category._id);
    }
    
    res.json({ message: 'Dépenses de toutes les catégories réinitialisées avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
