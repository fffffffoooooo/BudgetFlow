import { toast } from "sonner";
import { Alert } from "../types";

// Base URL pour l'API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Interface pour le token d'authentification
interface AuthToken {
  token: string;
  expiresAt: number;
}

// Interface pour les filtres de transactions
interface TransactionFilters {
  search?: string;
  categoryId?: string;
  type?: 'all' | 'expense' | 'income';
  dateRange?: { from?: Date; to?: Date };
  minAmount?: string;
  maxAmount?: string;
  limit?: number;
}

// Récupérer le token depuis le localStorage
const getToken = (): string | null => {
  const authData = localStorage.getItem("auth_token");
  if (!authData) return null;
  
  try {
    const parsedData: AuthToken = JSON.parse(authData);
    // Vérifier si le token a expiré
    if (parsedData.expiresAt < Date.now()) {
      localStorage.removeItem("auth_token");
      return null;
    }
    return parsedData.token;
  } catch (error) {
    localStorage.removeItem("auth_token");
    return null;
  }
};

// Sauvegarder le token dans le localStorage avec une expiration
const saveToken = (token: string, expiresIn: number = 86400): void => {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem("auth_token", JSON.stringify({ token, expiresAt }));
};

// Options par défaut pour fetch
const defaultOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

// Fonction principale pour faire des requêtes API
export const apiRequest = async <T>(
  endpoint: string, 
  method: string = "GET", 
  data: any = null, 
  requireAuth: boolean = true,
  isBinary: boolean = false
): Promise<T> => {
  const options: RequestInit = {
    ...defaultOptions,
    method,
  };

  // Ajouter le token d'authentification si nécessaire
  if (requireAuth) {
    const token = getToken();
    if (!token) {
      toast.error("Session expirée, veuillez vous reconnecter");
      throw new Error("Authentication required");
    }
    options.headers = {
      ...options.headers as Record<string, string>,
      Authorization: `Bearer ${token}`,
    };
  }

  // Ajouter le body si des données sont fournies
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Gérer les réponses binaires (PDF, CSV)
    if (isBinary) {
      return await response.blob() as unknown as T;
    }
    
    // Traiter la réponse JSON
    let responseData: any = {};
    try {
      responseData = await response.json();
    } catch (err) {
      // Si la réponse n'est pas JSON (ex: 500 HTML), fallback
      responseData = {};
    }

    if (!response.ok) {
      // Préférer le champ 'error', sinon 'message', sinon défaut
      const errorMsg = responseData.error || responseData.message || `Erreur ${response.status}`;
      // Gestion spécifique selon le code d'erreur
      if (response.status === 401 || response.status === 403) {
        toast.error("Accès refusé : veuillez vous reconnecter ou vérifier vos droits administrateur.");
      } else if (response.status === 400) {
        toast.error(errorMsg || "Requête invalide");
      } else if (response.status >= 500) {
        toast.error("Erreur serveur : " + errorMsg);
      } else {
        toast.error(errorMsg);
      }
      // Lancer l'erreur pour gestion amont
      throw new Error(errorMsg);
    }
    return responseData as T;
  } catch (error: any) {
    // Afficher l'erreur dans un toast
    toast.error(error.message || "Une erreur est survenue");
    throw error;
  }
};

// API Service
export const api = {


  // Auth endpoints
  auth: {
    getAllUsers: () => apiRequest<{ users: any[] }>("/auth/users", "GET"),
    register: (userData: { name: string; email: string; password: string }) => 
      apiRequest<{ token: string; user: any }>("/auth/register", "POST", userData, false),
    
    login: (credentials: { email: string; password: string }) => 
      apiRequest<{ token: string; user: any }>("/auth/login", "POST", credentials, false)
      .then(data => {
        saveToken(data.token);
        return data;
      }),
    
    logout: () => {
      localStorage.removeItem("auth_token");
    },
    
    getProfile: () => 
      apiRequest<{ user: any }>("/auth/profile", "GET"),
    
    updateProfile: (userData: { name?: string; email?: string; password?: string; alertEmail?: string; netIncomeCeiling?: number | null }) => 
      apiRequest<{ user: any }>("/auth/profile", "PUT", userData),
    
    deleteAccount: () => 
      apiRequest<{ message: string }>("/auth/profile", "DELETE"),
    
    checkNetIncomeCeiling: () => apiRequest<{
      alert: boolean;
      message: string;
      data: {
        total: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
        monthly: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
        weekly: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
      };
    }>("/auth/check-net-income-ceiling", "POST"),

    checkBalance: () => apiRequest<{
      alert: boolean;
      message: string;
      data: {
        total: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
        monthly: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
        weekly: { balance: number; ceiling: number; income: number; expenses: number; percentage: number; deficit: number };
      };
    }>("/alerts/check-balance", "POST"),
  },
  
  // Transactions endpoints
  transactions: {
    getAll: (filters: TransactionFilters = {}) => {
      // Conversion des filtres en query parameters
      const queryParams = new URLSearchParams();
      
      if (filters) {
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
        if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
        if (filters.dateRange?.from) queryParams.append('startDate', filters.dateRange.from.toISOString());
        if (filters.dateRange?.to) queryParams.append('endDate', filters.dateRange.to.toISOString());
        if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
        if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
      }
      
      const queryString = queryParams.toString();
      const url = `/transactions${queryString ? '?' + queryString : ''}`;
      
      return apiRequest<{ transactions: any[] }>(url, 'GET');
    },
    getByCategory: (categoryId: string, limit: number = 5) => {
      const queryParams = new URLSearchParams({
        category: categoryId,
        limit: limit.toString()
      });
      const url = `/transactions?${queryParams.toString()}`;
      return apiRequest<{ transactions: any[] }>(url, 'GET');
    },
    getById: (id: string) => apiRequest<any>(`/transactions/${id}`),
    create: (transactionData: { amount: number; type: "expense" | "income"; category: string; description: string; date: string; currency: string }) => 
      apiRequest<any>('/transactions', 'POST', transactionData),
    update: (id: string, transactionData: { amount?: number; category?: string; description?: string; date?: string; currency?: string }) => 
      apiRequest<any>(`/transactions/${id}`, 'PUT', transactionData),
    delete: (id: string) => apiRequest<{ success: boolean }>(`/transactions/${id}`, 'DELETE')
  },
  
  // Categories endpoints
  categories: {
    getAll: () => 
      apiRequest<{ categories: any[] }>("/categories", "GET"),
    
    getById: (id: string) => 
      apiRequest<{ category: any }>(`/categories/${id}`, "GET"),
    
    create: (categoryData: { name: string; color: string; type?: string; limit?: number }) => 
      apiRequest<{ category: any }>("/categories", "POST", categoryData),
    
    update: (id: string, categoryData: { name?: string; color?: string; limit?: number }) => 
      apiRequest<{ category: any }>(`/categories/${id}`, "PUT", categoryData),
    
    delete: (id: string) => 
      apiRequest<{ message: string }>(`/categories/${id}`, "DELETE"),
      
    // Nouvelles fonctions pour les dépenses mensuelles
    getCategorySpending: () => 
      apiRequest<{ categorySpending: any[] }>("/categories/spending", "GET"),
      
    resetCategorySpending: (id: string) => 
      apiRequest<{ message: string }>(`/categories/${id}/reset-spending`, "POST"),
      
    resetAllCategorySpending: () => 
      apiRequest<{ message: string }>("/categories/reset-all-spending", "POST"),
  },
  
  // Budgets and limits endpoints
  budgets: {
    getAll: () => 
      apiRequest<{ budgets: any[] }>("/budgets", "GET"),
    
    create: (budgetData: { category: string; amount: number; period: "monthly" | "weekly" | "yearly" }) => 
      apiRequest<{ budget: any }>("/budgets", "POST", budgetData),
    
    update: (id: string, budgetData: { amount?: number; period?: string }) => 
      apiRequest<{ budget: any }>(`/budgets/${id}`, "PUT", budgetData),
    
    delete: (id: string) => 
      apiRequest<{ message: string }>(`/budgets/${id}`, "DELETE"),
  },
  
  // Statistics endpoints - version complètement mise à jour
  statistics: {
    getData: (params: { type: 'monthly' | 'weekly' | 'yearly'; year?: number; month?: number; category?: string }) => 
      apiRequest<{ data: any }>(
        `/statistics?${new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              acc[key] = String(value);
            }
            return acc;
          }, {} as Record<string, string>)
        ).toString()}`, 
        "GET"
      ),

    getSummary: () => 
      apiRequest<{ totalIncome: number; totalExpense: number }>("/statistics/summary", "GET"),
      
    getByCategory: (startDate: string, endDate: string) => 
      apiRequest<{ data: any }>(`/statistics/by-category?startDate=${startDate}&endDate=${endDate}`, "GET"),
      
    getIncomeSources: (startDate: string, endDate: string) => 
      apiRequest<{ data: { name: string; value: number; color: string }[] }>(`/statistics/income-sources?startDate=${startDate}&endDate=${endDate}`, "GET"),

    getAdvancedMetrics: (period: 'week' | 'month' | 'year' = 'month') => 
      apiRequest<any>(`/statistics/advanced-metrics?period=${period}`, "GET"),
  },
  
  // Export endpoints
  export: {
    getPdf: (filters: any) => apiRequest<Blob>("/export/pdf", "POST", filters, true, true),
    getCsv: (filters: any) => apiRequest<Blob>("/export/csv", "POST", filters, true, true)
  },

  // Alerts endpoints
  alerts: {
    getAll: (status?: string) => apiRequest<any>(`/alerts${status ? `?status=${status}` : ''}`, "GET"),
    markAsRead: (ids: string[]) => apiRequest<any>("/alerts/mark-as-read", "PUT", { ids }),
    generateSpendingAlerts: () => apiRequest<any>("/alerts/generate-spending-alerts", "POST"),
    markAsReadById: (id: string) => apiRequest<any>(`/alerts/${id}/read`, "PUT"),
    resolve: (id: string) => apiRequest<any>(`/alerts/${id}/resolve`, "PUT"),
    create: (data: any) => apiRequest<any>("/alerts", "POST", data),
    delete: (id: string) => apiRequest<any>(`/alerts/${id}`, "DELETE"),
    getSettings: () => apiRequest<any>("/alerts/settings", "GET"),
    updateSettings: (settings: any) => apiRequest<any>("/alerts/settings", "PUT", { notifications: settings }),
    checkBudgetLimits: () => apiRequest<any>("/alerts/check-budget-limits", "POST"),
    testEmail: (alertId: string) => apiRequest<any>("/alerts/test-email", "POST", { alertId }),
  },
  
  // Nouvelles routes pour les abonnements
  subscriptions: {
    getAll: () => apiRequest<{ subscriptions: any[] }>("/subscriptions", "GET"),
    getUpcoming: () => apiRequest<{ upcomingPayments: any[] }>("/subscriptions/upcoming", "GET"),
    create: (data: any) => apiRequest<{ subscription: any }>("/subscriptions", "POST", data),
    update: (id: string, data: any) => apiRequest<{ subscription: any }>(`/subscriptions/${id}`, "PUT", data),
    delete: (id: string) => apiRequest<{ message: string }>(`/subscriptions/${id}`, "DELETE"),
  },

  // Nouvelles routes pour les finances
  finance: {
    getMonthlySummary: () => apiRequest<{
      monthlyIncome: number;
      monthlyExpenses: number;
      balance: number;
      savingsRate: number;
      subscriptionTotal: number;
      subscriptionCount: number;
    }>("/finance/monthly-summary", "GET"),
    getSavingsGoal: () => apiRequest<{
      targetAmount: number;
      currentAmount: number;
      progress: number;
      title: string;
      deadline?: Date;
    }>("/finance/savings-goal", "GET"),
    getUpcomingPayments: () => apiRequest<{ upcomingPayments: any[] }>("/finance/upcoming-payments", "GET"),
    getRecommendations: () => apiRequest<{ recommendations: any[] }>("/finance/recommendations", "GET"),
    
    // Objectifs d'épargne
    createSavingsGoal: (goalData: { title: string; targetAmount: number; currentAmount?: number; deadline?: string; description?: string }) => 
      apiRequest<any>("/finance/savings-goal", "POST", goalData),
    updateSavingsGoal: (id: string, goalData: { title?: string; targetAmount?: number; currentAmount?: number; deadline?: string; description?: string }) => 
      apiRequest<any>(`/finance/savings-goal/${id}`, "PUT", goalData),
    deleteSavingsGoal: (id: string) => 
      apiRequest<{ message: string }>(`/finance/savings-goal/${id}`, "DELETE"),
    updateSavingsAmount: (id: string, data: { currentAmount: number }) => 
      apiRequest<any>(`/finance/savings-goal/${id}/update-amount`, "PATCH", data),
    getSmartFinanceData: () => apiRequest<any>("/finance/smart-finance-data", "GET"),
  },

  // Exchange rates endpoint
  exchange: {
    getRates: () => apiRequest<Record<string, number>>("/exchange/rates", "GET")
  },

  // Vérifier le solde total et créer des alertes si insuffisant
  async checkBalance(): Promise<{
    alert: boolean;
    message: string;
    data: {
      total: {
        balance: number;
        ceiling: number;
        income: number;
        expenses: number;
        percentage: number;
        deficit: number;
      };
      monthly: {
        balance: number;
        ceiling: number;
        income: number;
        expenses: number;
        percentage: number;
        deficit: number;
      };
      weekly: {
        balance: number;
        ceiling: number;
        income: number;
        expenses: number;
        percentage: number;
        deficit: number;
      };
    };
  }> {
    const response = await fetch(`${API_URL}/alerts/check-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du solde');
    }

    return response.json();
  },

  savingsGoals: {
    getAll: () => apiRequest<{ savingsGoals: any[] }>("/savings-goals", "GET"),
    getStats: () => apiRequest<{ stats: any; goals: any[] }>("/savings-goals/stats", "GET"),
    create: (data: any) => apiRequest<{ savingsGoal: any }>("/savings-goals", "POST", data),
    update: (id: string, data: any) => apiRequest<{ savingsGoal: any }>(`/savings-goals/${id}`, "PUT", data),
    delete: (id: string) => apiRequest<{ message: string }>(`/savings-goals/${id}`, "DELETE"),
  },
};

// Hooks personnalisés pour vérifier l'état d'authentification
export const useAuth = () => {
  const isAuthenticated = !!getToken();
  
  return {
    isAuthenticated,
    getToken,
    logout: api.auth.logout,
  };
};
