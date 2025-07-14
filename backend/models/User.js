const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  alertEmail: {
    type: String,
    default: '' // Email de réception des alertes, personnalisable
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      app: {
        type: Boolean,
        default: true
      },
      budgetAlerts: {
        type: Boolean,
        default: true
      },
      unusualExpenses: {
        type: Boolean,
        default: true
      },
      subscriptionPayments: {
        type: Boolean,
        default: true
      },
      monthlyReports: {
        type: Boolean,
        default: false
      }
    }
  },
  netIncomeCeiling: {
    type: Number,
    default: null // Plafond de revenu net, optionnel
  },
});

// Middleware pour hasher le mot de passe avant l'enregistrement
UserSchema.pre('save', async function(next) {
  // Si le mot de passe n'a pas été modifié, passer au middleware suivant
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Générer un salt
    const salt = await bcrypt.genSalt(10);
    // Hasher le mot de passe avec le salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = mongoose.model('User', UserSchema);
