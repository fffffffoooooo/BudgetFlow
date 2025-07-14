/**
 * Utilitaires pour les fonctionnalités financières intelligentes
 */

import { formatCurrency, formatDate, formatTimeAgo, formatTimeAbbr } from './formatters';

/**
 * Types pour les fonctionnalités intelligentes
 */
export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  category: string;
  paymentMethod: string;
  isActive: boolean;
  lastUsed?: string;
  autoRenewal: boolean;
}

export interface BudgetPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  categories: BudgetCategory[];
  totalBudget: number;
  isActive: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  percentage: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  autoSave: boolean;
  autoSaveAmount?: number;
  autoSaveFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface AutoPayment {
  id: string;
  name: string;
  amount: number;
  recipient: string;
  scheduledDate: string;
  category: string;
  requiresConfirmation: boolean;
  confirmationMethod: 'manual' | 'sms' | 'email' | 'app';
  isRecurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'pending' | 'confirmed' | 'processed' | 'failed';
}

/**
 * Gère les abonnements et paiements récurrents
 */
export class SubscriptionManager {
  private subscriptions: SubscriptionItem[] = [];
  
  /**
   * Ajoute un nouvel abonnement
   */
  addSubscription(subscription: SubscriptionItem): SubscriptionItem {
    this.subscriptions.push(subscription);
    return subscription;
  }
  
  /**
   * Récupère tous les abonnements
   */
  getAllSubscriptions(): SubscriptionItem[] {
    return this.subscriptions;
  }
  
  /**
   * Récupère les abonnements actifs
   */
  getActiveSubscriptions(): SubscriptionItem[] {
    return this.subscriptions.filter(sub => sub.isActive);
  }
  
  /**
   * Récupère les abonnements par catégorie
   */
  getSubscriptionsByCategory(category: string): SubscriptionItem[] {
    return this.subscriptions.filter(sub => sub.category === category);
  }
  
  /**
   * Calcule le coût total mensuel des abonnements
   */
  calculateMonthlySubscriptionCost(): number {
    return this.getActiveSubscriptions().reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      
      // Convertir le montant en équivalent mensuel
      switch (sub.frequency) {
        case 'daily':
          monthlyAmount *= 30;
          break;
        case 'weekly':
          monthlyAmount *= 4.33;
          break;
        case 'quarterly':
          monthlyAmount /= 3;
          break;
        case 'yearly':
          monthlyAmount /= 12;
          break;
      }
      
      return total + monthlyAmount;
    }, 0);
  }
  
  /**
   * Identifie les abonnements potentiellement inutilisés
   */
  identifyUnusedSubscriptions(unusedDays: number = 30): SubscriptionItem[] {
    const today = new Date();
    return this.getActiveSubscriptions().filter(sub => {
      if (!sub.lastUsed) return false;
      
      const lastUsedDate = new Date(sub.lastUsed);
      const diffInDays = Math.floor((today.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffInDays >= unusedDays;
    });
  }
  
  /**
   * Génère des alertes pour les abonnements à venir
   */
  generateSubscriptionAlerts(daysThreshold: number = 7): any[] {
    const today = new Date();
    const alerts = [];
    
    for (const subscription of this.getActiveSubscriptions()) {
      const dueDate = new Date(subscription.nextDueDate);
      const diffInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays >= 0 && diffInDays <= daysThreshold) {
        alerts.push({
          id: `alert-${subscription.id}`,
          title: `Paiement à venir: ${subscription.name}`,
          amount: subscription.amount,
          dueDate: subscription.nextDueDate,
          daysRemaining: diffInDays,
          category: subscription.category,
          formattedAmount: formatCurrency(subscription.amount),
          formattedDate: formatDate(subscription.nextDueDate),
          priority: diffInDays <= 2 ? 'high' : 'medium'
        });
      }
    }
    
    return alerts;
  }
}

/**
 * Gère les paiements automatiques
 */
export class AutoPaymentManager {
  private payments: AutoPayment[] = [];
  
  /**
   * Ajoute un nouveau paiement automatique
   */
  addPayment(payment: AutoPayment): AutoPayment {
    this.payments.push(payment);
    return payment;
  }
  
  /**
   * Récupère tous les paiements automatiques
   */
  getAllPayments(): AutoPayment[] {
    return this.payments;
  }
  
  /**
   * Récupère les paiements en attente
   */
  getPendingPayments(): AutoPayment[] {
    return this.payments.filter(payment => payment.status === 'pending');
  }
  
  /**
   * Confirme un paiement automatique
   */
  confirmPayment(paymentId: string): AutoPayment | null {
    const payment = this.payments.find(p => p.id === paymentId);
    if (payment && payment.status === 'pending') {
      payment.status = 'confirmed';
      return payment;
    }
    return null;
  }
  
  /**
   * Génère des alertes pour les paiements à venir
   */
  generatePaymentAlerts(daysThreshold: number = 3): any[] {
    const today = new Date();
    const alerts = [];
    
    for (const payment of this.getPendingPayments()) {
      const scheduledDate = new Date(payment.scheduledDate);
      const diffInDays = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays >= 0 && diffInDays <= daysThreshold) {
        alerts.push({
          id: `payment-alert-${payment.id}`,
          title: `Paiement automatique à venir: ${payment.name}`,
          amount: payment.amount,
          scheduledDate: payment.scheduledDate,
          daysRemaining: diffInDays,
          recipient: payment.recipient,
          category: payment.category,
          requiresConfirmation: payment.requiresConfirmation,
          formattedAmount: formatCurrency(payment.amount),
          formattedDate: formatDate(payment.scheduledDate),
          priority: diffInDays === 0 ? 'high' : 'medium'
        });
      }
    }
    
    return alerts;
  }
}

/**
 * Gère les objectifs financiers intelligents
 */
export class FinancialGoalManager {
  private goals: FinancialGoal[] = [];
  
  /**
   * Ajoute un nouvel objectif financier
   */
  addGoal(goal: FinancialGoal): FinancialGoal {
    this.goals.push(goal);
    return goal;
  }
  
  /**
   * Récupère tous les objectifs financiers
   */
  getAllGoals(): FinancialGoal[] {
    return this.goals;
  }
  
  /**
   * Met à jour le montant actuel d'un objectif
   */
  updateGoalProgress(goalId: string, amount: number): FinancialGoal | null {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal) {
      goal.currentAmount += amount;
      return goal;
    }
    return null;
  }
  
  /**
   * Calcule le pourcentage de progression d'un objectif
   */
  calculateGoalProgress(goalId: string): number {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return 0;
    
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }
  
  /**
   * Génère des suggestions d'épargne automatique
   */
  generateSavingSuggestions(monthlyIncome: number, monthlyExpenses: number): any[] {
    const availableForSaving = monthlyIncome - monthlyExpenses;
    if (availableForSaving <= 0) return [];
    
    const suggestions = [];
    const incompleteGoals = this.goals.filter(g => g.currentAmount < g.targetAmount);
    
    for (const goal of incompleteGoals) {
      const remaining = goal.targetAmount - goal.currentAmount;
      const deadline = new Date(goal.deadline);
      const today = new Date();
      
      // Calculer le nombre de mois jusqu'à l'échéance
      const monthsRemaining = (deadline.getFullYear() - today.getFullYear()) * 12 + 
                             (deadline.getMonth() - today.getMonth());
      
      if (monthsRemaining <= 0) continue;
      
      // Calculer le montant mensuel nécessaire pour atteindre l'objectif
      const requiredMonthlySaving = remaining / monthsRemaining;
      
      // Vérifier si c'est réalisable avec le revenu disponible
      const percentOfAvailable = (requiredMonthlySaving / availableForSaving) * 100;
      const isRealistic = percentOfAvailable <= 50; // Ne pas suggérer plus de 50% du disponible
      
      suggestions.push({
        goalId: goal.id,
        goalName: goal.name,
        suggestedMonthlyAmount: Math.min(requiredMonthlySaving, availableForSaving * 0.5),
        requiredMonthlyAmount: requiredMonthlySaving,
        monthsToTarget: monthsRemaining,
        isRealistic: isRealistic,
        percentOfAvailableIncome: percentOfAvailable,
        priority: goal.priority
      });
    }
    
    // Trier par priorité et faisabilité
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.percentOfAvailableIncome - b.percentOfAvailableIncome;
    });
  }
}

/**
 * Gère la planification automatique du budget
 */
export class SmartBudgetPlanner {
  /**
   * Génère un budget automatique basé sur l'historique des transactions
   */
  generateAutoBudget(transactions: any[], monthlyIncome: number): BudgetPlan {
    // Regrouper les transactions par catégorie
    const categorizedTransactions = {};
    for (const transaction of transactions) {
      if (!transaction.category) continue;
      
      if (!categorizedTransactions[transaction.category]) {
        categorizedTransactions[transaction.category] = [];
      }
      categorizedTransactions[transaction.category].push(transaction);
    }
    
    // Calculer les dépenses moyennes par catégorie
    const categoryAverages = {};
    let totalAverage = 0;
    
    for (const category in categorizedTransactions) {
      const transactions = categorizedTransactions[category];
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const averageAmount = totalAmount / transactions.length;
      
      categoryAverages[category] = averageAmount;
      totalAverage += averageAmount;
    }
    
    // Créer les catégories de budget avec des allocations proportionnelles
    const budgetCategories: BudgetCategory[] = [];
    let remainingBudget = monthlyIncome;
    
    // Réserver 20% pour l'épargne
    const savingsAmount = monthlyIncome * 0.2;
    remainingBudget -= savingsAmount;
    
    budgetCategories.push({
      id: `category-${Date.now()}-savings`,
      name: 'Épargne',
      allocatedAmount: savingsAmount,
      spentAmount: 0,
      percentage: 20
    });
    
    // Répartir le reste selon les proportions historiques
    for (const category in categoryAverages) {
      if (totalAverage === 0) continue;
      
      const percentage = (categoryAverages[category] / totalAverage) * 80; // 80% du budget après épargne
      const allocatedAmount = (monthlyIncome * percentage) / 100;
      
      budgetCategories.push({
        id: `category-${Date.now()}-${category}`,
        name: category,
        allocatedAmount: allocatedAmount,
        spentAmount: 0,
        percentage: percentage
      });
    }
    
    // Créer le plan de budget
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 1);
    
    return {
      id: `budget-${Date.now()}`,
      name: `Budget automatique ${formatDate(today, 'short')} - ${formatDate(endDate, 'short')}`,
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      categories: budgetCategories,
      totalBudget: monthlyIncome,
      isActive: true
    };
  }
  
  /**
   * Détecte les dépassements de budget
   */
  detectBudgetOverruns(budget: BudgetPlan, transactions: any[]): any[] {
    const alerts = [];
    
    // Filtrer les transactions dans la période du budget
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const relevantTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Calculer les dépenses par catégorie
    const categorySpending = {};
    for (const transaction of relevantTransactions) {
      if (!transaction.category) continue;
      
      if (!categorySpending[transaction.category]) {
        categorySpending[transaction.category] = 0;
      }
      categorySpending[transaction.category] += Math.abs(transaction.amount);
    }
    
    // Vérifier les dépassements par catégorie
    for (const category of budget.categories) {
      const spent = categorySpending[category.name] || 0;
      const percentUsed = (spent / category.allocatedAmount) * 100;
      
      if (spent > category.allocatedAmount) {
        alerts.push({
          id: `overrun-${category.id}`,
          category: category.name,
          allocated: category.allocatedAmount,
          spent: spent,
          overrunAmount: spent - category.allocatedAmount,
          percentUsed: percentUsed,
          formattedAllocated: formatCurrency(category.allocatedAmount),
          formattedSpent: formatCurrency(spent),
          formattedOverrun: formatCurrency(spent - category.allocatedAmount),
          severity: percentUsed > 150 ? 'high' : percentUsed > 120 ? 'medium' : 'low'
        });
      } else if (percentUsed > 80) {
        // Alerte préventive si proche du dépassement
        alerts.push({
          id: `warning-${category.id}`,
          category: category.name,
          allocated: category.allocatedAmount,
          spent: spent,
          remainingAmount: category.allocatedAmount - spent,
          percentUsed: percentUsed,
          formattedAllocated: formatCurrency(category.allocatedAmount),
          formattedSpent: formatCurrency(spent),
          formattedRemaining: formatCurrency(category.allocatedAmount - spent),
          severity: 'warning'
        });
      }
    }
    
    return alerts;
  }
}