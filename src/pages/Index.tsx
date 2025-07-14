import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle, 
  ArrowRight, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { formatPercentage, formatDate, formatTimeAgo } from '@/utils/formatters';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useAuth } from '@/contexts/AuthContext';

// Composants
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { BudgetProgressCard } from '@/components/dashboard/BudgetProgressCard';
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    lastUpdateDate: new Date(),
    prevMonthIncome: 0,
    prevMonthExpense: 0,
    currentMonthIncome: 0,
    currentMonthExpense: 0,
    categorySpending: [] as Array<{categoryId: string; categoryName: string; amount: number; limit?: number; color: string}>
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Charger en parallèle pour optimiser
      const [transactionsRes, budgetsRes] = await Promise.all([
        api.transactions.getAll({ limit: 5 }),
        api.budgets.getAll()
      ]);
      
      setTransactions(transactionsRes.transactions || []);
      setBudgets(budgetsRes.budgets || []);
      
      // Essayer de récupérer les données de statistiques réelles
      try {
        const statsResponse = await api.statistics.getData({
          type: 'yearly',
          year: new Date().getFullYear()
        });
        
        if (statsResponse && statsResponse.data && statsResponse.data.length > 0) {
          setMonthlyData(statsResponse.data);
        } else {
          const demoMonthlyData = generateDemoMonthlyData();
          setMonthlyData(demoMonthlyData);
        }
      } catch (statsError) {
        console.error("Erreur lors du chargement des statistiques:", statsError);
        const demoMonthlyData = generateDemoMonthlyData();
        setMonthlyData(demoMonthlyData);
      }
      
      // Obtenir les transactions et catégories pour calculer les montants mensuels
      const [allTransactionsRes, categoriesRes] = await Promise.all([
        api.transactions.getAll(),
        api.categories.getAll()
      ]);
      
      const transactions = allTransactionsRes.transactions || [];
      const categories = categoriesRes.categories || [];
      const budgets = budgetsRes.budgets || [];

      // Calculer les totaux et les statistiques mensuelles
      const summary = calculateFinancialSummary(transactions, categories, budgets);
      setFinancialSummary(summary);
      
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Impossible de charger les données du tableau de bord");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour générer des données de démonstration pour le graphique
  const generateDemoMonthlyData = () => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    
    // Prendre uniquement les 5 derniers mois jusqu'au mois actuel
    const recentMonths = monthNames.slice(Math.max(0, currentMonth - 4), currentMonth + 1);
    
    return recentMonths.map((name, index) => ({
      name,
      income: 1800 + Math.random() * 600,
      expenses: 600 + Math.random() * 500
    }));
  };

  // Calculer les dépenses par catégorie
  const calculateCategorySpending = (transactions: any[], categories: any[], budgets: any[]) => {
    // Créer un objet pour stocker les dépenses par catégorie
    const categorySpendingMap: Record<string, {categoryId: string; categoryName: string; amount: number; limit?: number; color: string}> = {};
    
    // Initialiser avec les catégories existantes
    categories.forEach(cat => {
      if (cat.type !== 'income') { // Ne pas inclure les catégories de revenus
        categorySpendingMap[cat._id] = {
          categoryId: cat._id,
          categoryName: cat.name,
          amount: 0,
          limit: cat.limit,
          color: cat.color || '#3b82f6'
        };
      }
    });
    
    // Calculer les dépenses par catégorie
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category) {
        const categoryId = typeof transaction.category === 'string' 
          ? transaction.category 
          : transaction.category._id;
          
        if (categorySpendingMap[categoryId]) {
          categorySpendingMap[categoryId].amount += transaction.amount || 0;
        } else {
          // Si la catégorie n'existe pas encore, l'ajouter
          categorySpendingMap[categoryId] = {
            categoryId,
            categoryName: typeof transaction.category === 'object' ? transaction.category.name : 'Non catégorisé',
            amount: transaction.amount || 0,
            color: typeof transaction.category === 'object' ? (transaction.category.color || '#3b82f6') : '#3b82f6'
          };
        }
      }
    });
    
    // Appliquer les limites de budget si disponibles
    budgets.forEach(budget => {
      const categoryId = typeof budget.category === 'string' ? budget.category : budget.category._id;
      if (categorySpendingMap[categoryId]) {
        categorySpendingMap[categoryId].limit = budget.amount;
      }
    });
    
    // Convertir en tableau et trier par montant décroissant
    return Object.values(categorySpendingMap).sort((a, b) => b.amount - a.amount);
  };
  
  // Calculer les totaux financiers basés sur les transactions
  const calculateFinancialSummary = (transactions: any[], categories: any[] = [], budgets: any[] = []) => {
    let totalIncome = 0;
    let totalExpense = 0;
    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let prevMonthIncome = 0;
    let prevMonthExpense = 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = transactionDate.getMonth();
      const transactionYear = transactionDate.getFullYear();
      const amount = transaction.amount || 0;
      
      if (transaction.type === 'income') {
        totalIncome += amount;
        
        if (transactionYear === currentYear && transactionMonth === currentMonth) {
          currentMonthIncome += amount;
        } else if (
          (transactionYear === currentYear && transactionMonth === currentMonth - 1) ||
          (currentMonth === 0 && transactionYear === currentYear - 1 && transactionMonth === 11)
        ) {
          prevMonthIncome += amount;
        }
      } else {
        totalExpense += amount;
        
        if (transactionYear === currentYear && transactionMonth === currentMonth) {
          currentMonthExpense += amount;
        } else if (
          (transactionYear === currentYear && transactionMonth === currentMonth - 1) ||
          (currentMonth === 0 && transactionYear === currentYear - 1 && transactionMonth === 11)
        ) {
          prevMonthExpense += amount;
        }
      }
    });
    
    // Calculer les dépenses par catégorie
    const categorySpending = calculateCategorySpending(transactions, categories, budgets);
    
    return {
      totalIncome,
      totalExpense,
      lastUpdateDate: new Date(),
      prevMonthIncome,
      prevMonthExpense,
      currentMonthIncome,
      currentMonthExpense,
      categorySpending
    };
  };

  // Calculer les pourcentages de variation par rapport au mois précédent
  const getIncomeChangePercentage = () => {
    if (financialSummary.prevMonthIncome === 0) return 100;
    return ((financialSummary.currentMonthIncome - financialSummary.prevMonthIncome) / financialSummary.prevMonthIncome) * 100;
  };

  const getExpenseChangePercentage = () => {
    if (financialSummary.prevMonthExpense === 0) return 0;
    return ((financialSummary.currentMonthExpense - financialSummary.prevMonthExpense) / financialSummary.prevMonthExpense) * 100;
  };

  const incomeChangePercentage = getIncomeChangePercentage();
  const expenseChangePercentage = getExpenseChangePercentage();

  // Fonctions pour les boutons d'action
  const handleAddExpense = () => {
    navigate('/add-transaction?type=expense');
  };

  const handleAddIncome = () => {
    navigate('/add-transaction?type=income');
  };

  const handleAddTransaction = () => {
    navigate('/add-transaction');
  };

  return (
    <div className="space-y-8">
      {/* Header moderne avec animations */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <Clock className="h-4 w-4" />
              Mise à jour {formatTimeAgo(financialSummary.lastUpdateDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={handleAddExpense}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-initial border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950/30 transition-all duration-200"
          >
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
            <span>Dépense</span>
          </Button>
          <Button
            onClick={handleAddIncome}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-initial border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/30 transition-all duration-200"
          >
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
            <span>Revenu</span>
          </Button>
          <Button
            onClick={handleAddTransaction}
            className="gap-2 flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="sm:inline hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Section principale avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4">
          <div className="transform hover:scale-[1.02] transition-all duration-300">
            <BalanceCard
              totalIncome={financialSummary.totalIncome}
              totalExpense={financialSummary.totalExpense}
            />
          </div>
        </div>
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Carte Revenus avec effets modernes */}
          <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-muted-foreground">Revenus (ce mois)</h3>
                <div className={`flex items-center gap-1 ${incomeChangePercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {incomeChangePercentage >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {Math.abs(incomeChangePercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold text-success">
                  <CurrencyDisplay amount={financialSummary.currentMonthIncome} fromCurrency="EUR" />
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mois précédent: <CurrencyDisplay amount={financialSummary.prevMonthIncome} fromCurrency="EUR" />
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Carte Dépenses avec effets modernes */}
          <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-muted-foreground">Dépenses (ce mois)</h3>
                <div className={`flex items-center gap-1 ${expenseChangePercentage <= 0 ? 'text-success' : 'text-destructive'}`}>
                  {expenseChangePercentage <= 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  <span className="text-sm font-semibold">
                    {Math.abs(expenseChangePercentage).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-3xl font-bold text-destructive">
                  <CurrencyDisplay amount={financialSummary.currentMonthExpense} fromCurrency="EUR" />
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mois précédent: <CurrencyDisplay amount={financialSummary.prevMonthExpense} fromCurrency="EUR" />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section graphiques avec animation d'entrée */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-12">
          <div className="transform hover:scale-[1.01] transition-all duration-300">
            <DashboardTabs monthlyData={monthlyData} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Section inférieure avec design moderne */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Suivi des catégories
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <BudgetProgressCard 
                budgets={financialSummary.categorySpending.map(cat => ({
                  _id: cat.categoryId,
                  amount: cat.limit || 0,
                  spent: cat.amount,
                  category: {
                    _id: cat.categoryId,
                    name: cat.categoryName,
                    color: cat.color
                  }
                }))} 
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-7">
          <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                Transactions récentes
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <RecentTransactionsCard transactions={transactions} loading={isLoading} />
            </CardContent>
            <CardFooter className="pt-2 relative z-10">
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                onClick={() => navigate('/transactions')}
              >
                Voir toutes les transactions
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}