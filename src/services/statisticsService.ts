
import { api } from './api';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';

export interface StatisticsData {
  name: string;
  income: number;
  expenses: number;
  [key: string]: any;
}

export interface CategorySpending {
  _id: string;
  name: string;
  color: string;
  total: number;
}

export interface StatisticsSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
}

export interface AdvancedMetrics {
  totalStats: any[];
  categoryBreakdown: any[];
  dailyAverage: any[];
  topExpenseCategories: any[];
  period: string;
  dateRange: { startDate: Date; endDate: Date };
}

// Fonction utilitaire pour formater la date au format YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Fonction utilitaire pour générer des données CSV
const generateCSV = (data: any[], headers: string[]): string => {
  const csvRows = [];
  
  // Ajouter l'en-tête
  csvRows.push(headers.join(','));
  
  // Ajouter les données
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header.toLowerCase()] || '';
      // Échapper les virgules et les guillemets
      const escaped = ('' + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

export const statisticsService = {
  // Récupère les données mensuelles pour une année et un mois spécifiques
  async getMonthlyData(year: number, month: number, categoryId?: string): Promise<StatisticsData[]> {
    try {
      const response = await api.statistics.getData({
        type: 'monthly',
        year,
        month,
        category: categoryId
      });
      
      console.log('Données mensuelles reçues:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des données mensuelles:', error);
      toast.error('Erreur lors du chargement des statistiques mensuelles');
      throw error;
    }
  },

  // Récupère les données annuelles pour une année spécifique
  async getYearlyData(year: number, categoryId?: string): Promise<StatisticsData[]> {
    try {
      const response = await api.statistics.getData({
        type: 'yearly',
        year,
        category: categoryId
      });
      
      console.log('Données annuelles reçues:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des données annuelles:', error);
      toast.error('Erreur lors du chargement des statistiques annuelles');
      throw error;
    }
  },

  // Récupère les dépenses par catégorie pour une période donnée
  async getCategorySpending(startDate?: string, endDate?: string): Promise<CategorySpending[]> {
    try {
      // Définir des dates par défaut si non fournies (mois en cours)
      if (!startDate || !endDate) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        startDate = startDate || firstDay;
        endDate = endDate || lastDay;
      }

      const response = await api.statistics.getByCategory(startDate, endDate);
      console.log('Dépenses par catégorie reçues:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des dépenses par catégorie:', error);
      toast.error('Erreur lors du chargement des dépenses par catégorie');
      throw error;
    }
  },

  // Récupère le résumé des statistiques (totaux, équilibre, taux d'épargne)
  async getSummary(): Promise<StatisticsSummary> {
    try {
      const response = await api.statistics.getSummary();
      
      const totalIncome = response.totalIncome || 0;
      const totalExpense = response.totalExpense || 0;
      const balance = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
      
      return {
        totalIncome,
        totalExpense,
        balance,
        savingsRate
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé des statistiques:', error);
      toast.error('Erreur lors du chargement du résumé financier');
      throw error;
    }
  },
  
  // Récupère les données pour les graphiques hebdomadaires
  async getWeeklyData(categoryId?: string): Promise<{ name: string; value: number }[]> {
    try {
      const response = await api.statistics.getData({ 
        type: 'weekly',
        category: categoryId !== 'all' ? categoryId : undefined
      });
      
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days.map(day => ({
        name: day,
        value: response.data[day] || 0
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données hebdomadaires:', error);
      toast.error('Erreur lors du chargement des données hebdomadaires');
      throw error;
    }
  },
  
  // Récupère les sources de revenus pour une période donnée
  async getIncomeSources(startDate: string, endDate: string): Promise<{ name: string; value: number; color: string }[]> {
    try {
      const response = await api.statistics.getIncomeSources(startDate, endDate);
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des sources de revenus:', error);
      toast.error('Erreur lors du chargement des sources de revenus');
      throw error;
    }
  },

  // Récupère les métriques avancées
  async getAdvancedMetrics(period: 'week' | 'month' | 'year' = 'month'): Promise<AdvancedMetrics> {
    try {
      return await api.statistics.getAdvancedMetrics(period);
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques avancées:', error);
      toast.error('Erreur lors du chargement des métriques avancées');
      throw error;
    }
  },
  
  // Exporte les statistiques au format CSV
  async exportToCSV(params: { startDate?: string; endDate?: string; categoryId?: string } = {}): Promise<Blob> {
    try {
      // Définir les dates par défaut (mois en cours)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = params.startDate || formatDate(firstDay);
      const endDate = params.endDate || formatDate(lastDay);
      
      // Récupérer les données nécessaires
      const [monthlyData, categorySpending, summary] = await Promise.all([
        this.getMonthlyData(now.getFullYear(), now.getMonth() + 1, params.categoryId),
        this.getCategorySpending(startDate, endDate),
        this.getSummary()
      ]);
      
      // Préparer les données pour le CSV
      const csvData = [
        // En-tête
        { type: 'Résumé', name: 'Revenus', value: formatCurrency(summary.totalIncome) },
        { type: 'Résumé', name: 'Dépenses', value: formatCurrency(summary.totalExpense) },
        { type: 'Résumé', name: 'Solde', value: formatCurrency(summary.balance) },
        { type: 'Résumé', name: "Taux d'épargne", value: `${summary.savingsRate}%` },
        // Sépareur
        { type: '', name: '', value: '' },
        // Dépenses par catégorie
        { type: 'Dépenses par catégorie', name: 'Catégorie', value: 'Montant' },
        ...categorySpending.map(cat => ({
          type: 'Dépenses par catégorie',
          name: cat.name,
          value: formatCurrency(cat.total)
 })),
        // Sépareur
        { type: '', name: '', value: '' },
        // Données mensuelles
        { type: 'Détails mensuels', name: 'Mois', value: 'Revenus', value2: 'Dépenses' },
        ...monthlyData.map((data: any) => ({
          type: 'Détails mensuels',
          name: data.name,
          value: formatCurrency(data.income || 0),
          value2: formatCurrency(data.expenses || 0)
        }))
      ];
      
      // Convertir en CSV
      const csvContent = generateCSV(csvData, ['type', 'name', 'value', 'value2']);
      
      // Créer un Blob avec BOM pour l'encodage UTF-8
      const BOM = '\uFEFF';
      return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Erreur lors de la génération du CSV:', error);
      toast.error('Erreur lors de la génération du rapport CSV');
      throw error;
    }
  },
  
  // Exporte les statistiques au format PDF
  async exportToPDF(params: { startDate?: string; endDate?: string; categoryId?: string } = {}): Promise<Blob> {
    try {
      // Utiliser l'API existante pour l'export PDF
      return await api.export.getPdf({
        startDate: params.startDate,
        endDate: params.endDate,
        categoryId: params.categoryId
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du rapport PDF');
      throw error;
    }
  }
};
