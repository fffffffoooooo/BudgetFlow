const mongoose = require('mongoose');

const CategorySpendingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  month: {
    type: Number,  // 1-12 représentant le mois
    required: true
  },
  year: {
    type: Number,  // Année complète (ex: 2025)
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index composé pour assurer l'unicité par catégorie, utilisateur, mois et année
CategorySpendingSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('CategorySpending', CategorySpendingSchema);
