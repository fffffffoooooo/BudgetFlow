
// Catégories par défaut à créer pour les nouveaux utilisateurs
const defaultCategories = [
  // Revenus
  { name: 'Salaire', color: '#10b981', type: 'income' },
  { name: 'Freelance', color: '#06b6d4', type: 'income' },
  { name: 'Investissements', color: '#8b5cf6', type: 'income' },
  { name: 'Aide/Allocations', color: '#f59e0b', type: 'income' },
  { name: 'Vente', color: '#ef4444', type: 'income' },
  
  // Dépenses essentielles
  { name: 'Logement', color: '#3b82f6', type: 'expense' },
  { name: 'Alimentation', color: '#22c55e', type: 'expense' },
  { name: 'Transport', color: '#f97316', type: 'expense' },
  { name: 'Santé', color: '#ec4899', type: 'expense' },
  { name: 'Assurances', color: '#6366f1', type: 'expense' },
  
  // Dépenses courantes
  { name: 'Abonnements', color: '#8b5cf6', type: 'expense' },
  { name: 'Loisirs', color: '#f59e0b', type: 'expense' },
  { name: 'Vêtements', color: '#14b8a6', type: 'expense' },
  { name: 'Éducation', color: '#ef4444', type: 'expense' },
  { name: 'Cadeaux', color: '#f97316', type: 'expense' }
];

module.exports = { defaultCategories };
