
/**
 * Formatte un montant en devise (€ par défaut)
 */
export const formatCurrency = (
  amount: number, 
  currencyOrOptions: string | { minimumFractionDigits?: number; maximumFractionDigits?: number } = '€'
): string => {
  // Default options
  let currency = '€';
  let options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  // Handle different parameter types
  if (typeof currencyOrOptions === 'string') {
    // If it's a string, use it as currency
    currency = currencyOrOptions;
    options.currency = currency === '€' ? 'EUR' : currency;
  } else if (typeof currencyOrOptions === 'object') {
    // If it's an object, merge with default options
    options = {
      ...options,
      ...currencyOrOptions
    };
  }

  return new Intl.NumberFormat('fr-FR', options).format(amount);
};

/**
 * Formatte une date selon le format spécifié
 */
export const formatDate = (dateString: string | Date, format: "short" | "medium" | "long" = "medium"): string => {
  if (!dateString) {
    return "Date inconnue";
  }
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("Invalid date value:", dateString);
      return "Date invalide";
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (format === "short") {
      options.month = "2-digit";
      options.day = "2-digit";
      options.year = undefined;
    } else if (format === "long") {
      options.weekday = "long";
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Date invalide";
  }
};

/**
 * Formatte un temps passé (il y a X jours, etc.)
 */
export const formatTimeAgo = (dateString: string | Date): string => {
  if (!dateString) {
    return "Date inconnue";
  }
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    const now = new Date();
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'à l\'instant';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `il y a ${diffInMonths} mois`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "Date invalide";
  }
};

/**
 * Formatte un pourcentage
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Formatte un temps passé en abréviation (1j, 2h, etc.)
 */
export const formatTimeAbbr = (dateString: string | Date): string => {
  if (!dateString) {
    return "--";
  }
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "--";
    }
    
    const now = new Date();
    
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'inst.';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}j`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mois`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears}a`;
  } catch (error) {
    console.error("Error calculating time abbreviation:", error);
    return "--";
  }
};

/**
 * Fonctionnalités intelligentes pour l'automatisation financière
 */

/**
 * Génère des rappels de paiement intelligents
 * @param transactions Liste des transactions récurrentes
 * @param daysBeforeNotification Nombre de jours avant l'échéance pour notifier
 */
export const generatePaymentReminders = (transactions: any[], daysBeforeNotification: number = 3): any[] => {
  const today = new Date();
  const reminders = [];
  
  for (const transaction of transactions) {
    if (transaction.isRecurring && transaction.nextDueDate) {
      const dueDate = new Date(transaction.nextDueDate);
      const diffInDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays <= daysBeforeNotification && diffInDays >= 0) {
        reminders.push({
          id: `reminder-${transaction.id}`,
          title: `Paiement à venir: ${transaction.label}`,
          amount: transaction.amount,
          dueDate: transaction.nextDueDate,
          daysRemaining: diffInDays,
          category: transaction.category,
          priority: diffInDays === 0 ? 'high' : 'medium'
        });
      }
    }
  }
  
  return reminders;
};

/**
 * Détecte les transactions récurrentes automatiquement
 * @param transactions Liste des transactions
 * @param minOccurrences Nombre minimum d'occurrences pour considérer une transaction comme récurrente
 */
export const detectRecurringTransactions = (transactions: any[], minOccurrences: number = 3): any[] => {
  // Regrouper les transactions par bénéficiaire et montant similaire
  const transactionGroups = {};
  
  for (const transaction of transactions) {
    const key = `${transaction.payee}-${Math.round(transaction.amount)}`;
    if (!transactionGroups[key]) {
      transactionGroups[key] = [];
    }
    transactionGroups[key].push(transaction);
  }
  
  // Identifier les groupes avec des intervalles réguliers
  const recurringTransactions = [];
  
  for (const key in transactionGroups) {
    const group = transactionGroups[key];
    if (group.length >= minOccurrences) {
      // Trier par date
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculer les intervalles entre transactions
      const intervals = [];
      for (let i = 1; i < group.length; i++) {
        const daysDiff = Math.floor(
          (new Date(group[i].date).getTime() - new Date(group[i-1].date).getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }
      
      // Vérifier si les intervalles sont réguliers (avec une marge d'erreur de 3 jours)
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      const isRegular = intervals.every(interval => Math.abs(interval - averageInterval) <= 3);
      
      if (isRegular) {
        const lastTransaction = group[group.length - 1];
        const nextDueDate = new Date(lastTransaction.date);
        nextDueDate.setDate(nextDueDate.getDate() + Math.round(averageInterval));
        
        recurringTransactions.push({
          id: `recurring-${lastTransaction.id}`,
          payee: lastTransaction.payee,
          amount: lastTransaction.amount,
          category: lastTransaction.category,
          frequency: averageInterval > 25 ? 'monthly' : averageInterval > 6 ? 'weekly' : 'daily',
          intervalDays: Math.round(averageInterval),
          lastDate: lastTransaction.date,
          nextDueDate: nextDueDate.toISOString().split('T')[0],
          confidence: calculateConfidence(group.length, intervals)
        });
      }
    }
  }
  
  return recurringTransactions;
};

/**
 * Calcule le niveau de confiance pour une transaction récurrente
 */
const calculateConfidence = (occurrences: number, intervals: number[]): number => {
  // Plus d'occurrences et d'intervalles réguliers = plus de confiance
  const baseConfidence = Math.min(occurrences * 10, 70);
  
  // Calculer la variance des intervalles (plus c'est bas, plus c'est régulier)
  const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
  const regularityScore = Math.max(0, 30 - variance);
  
  return Math.min(baseConfidence + regularityScore, 100);
};

/**
 * Génère une répartition automatique des revenus
 * @param income Montant du revenu
 * @param allocationRules Règles de répartition
 */
export const autoAllocateIncome = (income: number, allocationRules: {category: string, percentage: number}[]): any[] => {
  const allocations = [];
  
  for (const rule of allocationRules) {
    const amount = income * (rule.percentage / 100);
    allocations.push({
      category: rule.category,
      amount: amount,
      percentage: rule.percentage
    });
  }
  
  return allocations;
};

/**
 * Calcule un score financier personnel
 * @param financialData Données financières de l'utilisateur
 */
interface FinancialData {
  monthlySavings?: number;
  monthlyExpenses?: number;
  paymentHistory?: Array<{isLate: boolean}>;
  incomeSources?: Array<any>;
  budgetAdherence?: number;
  totalDebt?: number;
  monthlyIncome?: number;
}

interface ScoreDetails {
  savingsScore?: number;
  paymentScore?: number;
  diversityScore?: number;
  budgetScore?: number;
  debtScore?: number;
  [key: string]: number | undefined;
}

export const calculateFinancialScore = (financialData: FinancialData): {score: number, details: ScoreDetails} => {
  let score = 50; // Score de base
  const details: ScoreDetails = {};
  
  // Facteur 1: Ratio épargne/dépenses
  if (financialData.monthlySavings && financialData.monthlyExpenses) {
    const savingsRatio = financialData.monthlySavings / (financialData.monthlyExpenses + financialData.monthlySavings);
    const savingsScore = Math.min(Math.round(savingsRatio * 100), 30);
    score += savingsScore;
    details.savingsScore = savingsScore;
  }
  
  // Facteur 2: Régularité des paiements
  if (financialData.paymentHistory) {
    const latePayments = financialData.paymentHistory.filter(p => p.isLate).length;
    const totalPayments = financialData.paymentHistory.length;
    const paymentScore = totalPayments > 0 ? Math.round((1 - latePayments / totalPayments) * 20) : 0;
    score += paymentScore;
    details.paymentScore = paymentScore;
  }
  
  // Facteur 3: Diversité des revenus
  if (financialData.incomeSources) {
    const diversityScore = Math.min(financialData.incomeSources.length * 5, 15);
    score += diversityScore;
    details.diversityScore = diversityScore;
  }
  
  // Facteur 4: Gestion du budget
  if (financialData.budgetAdherence) {
    const budgetScore = Math.round(financialData.budgetAdherence * 15);
    score += budgetScore;
    details.budgetScore = budgetScore;
  }
  
  // Facteur 5: Ratio dette/revenu
  if (financialData.totalDebt && financialData.monthlyIncome) {
    const debtRatio = financialData.totalDebt / (financialData.monthlyIncome * 12);
    const debtScore = Math.max(20 - Math.round(debtRatio * 100), 0);
    score += debtScore;
    details.debtScore = debtScore;
  }
  
  return {
    score: Math.min(score, 100),
    details: details
  };
};

/**
 * Génère des suggestions d'économies personnalisées
 * @param transactions Liste des transactions
 */
export const generateSavingsSuggestions = (transactions: any[]): any[] => {
  const suggestions = [];
  
  // Regrouper les transactions par catégorie
  const categorizedTransactions = {};
  for (const transaction of transactions) {
    if (!categorizedTransactions[transaction.category]) {
      categorizedTransactions[transaction.category] = [];
    }
    categorizedTransactions[transaction.category].push(transaction);
  }
  
  // Analyser les catégories pour trouver des opportunités d'économies
  for (const category in categorizedTransactions) {
    const categoryTransactions = categorizedTransactions[category];
    const totalSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averagePerTransaction = totalSpent / categoryTransactions.length;
    
    // Identifier les transactions supérieures à la moyenne
    const highTransactions = categoryTransactions.filter(t => t.amount > averagePerTransaction * 1.5);
    
    if (highTransactions.length > 0) {
      suggestions.push({
        category: category,
        potentialSavings: Math.round(highTransactions.reduce((sum, t) => sum + (t.amount - averagePerTransaction), 0)),
        message: `Vous pourriez économiser en réduisant vos dépenses exceptionnelles dans la catégorie ${category}`,
        transactions: highTransactions
      });
    }
    
    // Identifier les abonnements potentiellement inutilisés
    if (category === 'Abonnements' || category === 'Services') {
      const subscriptions = categoryTransactions.filter(t => t.isRecurring);
      for (const subscription of subscriptions) {
        if (subscription.lastUsed && new Date(subscription.lastUsed).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000) {
          suggestions.push({
            category: 'Abonnements inutilisés',
            potentialSavings: subscription.amount,
            message: `Votre abonnement à ${subscription.payee} n'a pas été utilisé depuis plus d'un mois`,
            transaction: subscription
          });
        }
      }
    }
  }
  
  return suggestions;
};
