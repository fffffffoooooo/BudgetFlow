const CategorySpending = require('../models/CategorySpending');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

/**
 * Réinitialise ou crée un suivi de dépenses pour une catégorie pour le mois courant
 * @param {string} userId - ID de l'utilisateur
 * @param {string} categoryId - ID de la catégorie
 */
const resetCategorySpending = async (userId, categoryId) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() retourne 0-11
  const currentYear = now.getFullYear();

  // Trouver ou créer l'enregistrement de dépense pour cette catégorie et ce mois
  await CategorySpending.findOneAndUpdate(
    { 
      user: userId, 
      category: categoryId, 
      month: currentMonth, 
      year: currentYear 
    },
    { 
      amount: 0,
      updatedAt: now
    },
    { 
      upsert: true, // Créer si n'existe pas 
      new: true 
    }
  );
};

/**
 * Réinitialise les dépenses de toutes les catégories pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
const resetAllCategoriesSpending = async (userId) => {
  const categories = await Category.find({ user: userId });
  
  for (const category of categories) {
    await resetCategorySpending(userId, category._id);
  }
};

/**
 * Met à jour les dépenses d'une catégorie basé sur une transaction
 * @param {string} userId - ID de l'utilisateur
 * @param {string} categoryId - ID de la catégorie
 * @param {number} amount - Montant à ajouter (positif) ou soustraire (négatif)
 * @param {Date} date - Date de la transaction
 */
const updateCategorySpending = async (userId, categoryId, amount, date) => {
  const transactionDate = new Date(date);
  const month = transactionDate.getMonth() + 1;
  const year = transactionDate.getFullYear();

  // Mettre à jour les dépenses de cette catégorie pour ce mois
  await CategorySpending.findOneAndUpdate(
    { 
      user: userId, 
      category: categoryId, 
      month: month, 
      year: year 
    },
    { 
      $inc: { amount: amount },
      updatedAt: new Date()
    },
    { 
      upsert: true, // Créer si n'existe pas
      new: true 
    }
  );
};

/**
 * Vérifie si nous sommes au début d'un nouveau mois et réinitialise les dépenses si nécessaire
 * @param {string} userId - ID de l'utilisateur
 */
const checkAndResetMonthlySpending = async (userId) => {
  const now = new Date();
  const currentDay = now.getDate();
  
  // Si nous sommes le premier jour du mois, réinitialiser toutes les dépenses
  if (currentDay === 1) {
    await resetAllCategoriesSpending(userId);
    console.log(`Dépenses réinitialisées pour l'utilisateur ${userId} au début du mois`);
  }
};

module.exports = {
  resetCategorySpending,
  resetAllCategoriesSpending,
  updateCategorySpending,
  checkAndResetMonthlySpending
};
