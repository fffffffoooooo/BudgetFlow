const mongoose = require('mongoose');

const SavingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Objectif d\'épargne'
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyContribution: {
    type: Number,
    default: 0,
    min: 0
  },
  suggestedContribution: {
    type: Number,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['emergency', 'vacation', 'house', 'car', 'education', 'retirement', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculer la progression en pourcentage
SavingsGoalSchema.virtual('progress').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Calculer le montant restant
SavingsGoalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Calculer le temps restant en mois (si une date cible est définie)
SavingsGoalSchema.virtual('monthsRemaining').get(function() {
  if (!this.targetDate) return null;
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target - now;
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return Math.max(diffMonths, 0);
});

// Mettre à jour la contribution suggérée
SavingsGoalSchema.methods.updateSuggestedContribution = function() {
  if (this.targetDate) {
    const monthsRemaining = this.monthsRemaining;
    if (monthsRemaining > 0) {
      this.suggestedContribution = Math.ceil(this.remainingAmount / monthsRemaining);
    } else {
      this.suggestedContribution = this.remainingAmount;
    }
  } else {
    // Si pas de date cible, suggérer 10% du montant restant
    this.suggestedContribution = Math.ceil(this.remainingAmount * 0.1);
  }
  return this.suggestedContribution;
};

// Middleware pour mettre à jour la contribution suggérée avant la sauvegarde
SavingsGoalSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.updateSuggestedContribution();
  next();
});

module.exports = mongoose.model('SavingsGoal', SavingsGoalSchema);
