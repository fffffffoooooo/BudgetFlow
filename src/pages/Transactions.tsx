import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, Plus, Trash2, Search, Filter, 
  TrendingUp, TrendingDown, Calendar,
  RefreshCw, Download, Eye, EyeOff, X, DollarSign, Tag, ArrowUpDown, ArrowUp, ArrowDown, Target, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import DateRangeSelector from '@/components/DateRangeSelector';
import TransactionModal from '@/components/TransactionModal';
import { DateRange } from 'react-day-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCurrency } from '@/contexts/CurrencyContext';
import { notificationService } from "@/services/notificationService";
import { exportService } from "@/services/exportService";
import ExportActions from '@/components/ExportActions';

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  currency: string;
  category: {
    _id: string;
    name: string;
    color: string;
  } | null;
}

interface TransactionFilters {
  search: string;
  categoryId: string;
  type: 'all' | 'expense' | 'income';
  dateRange: DateRange | undefined;
  minAmount: string;
  maxAmount: string;
  status: 'all' | 'recent' | 'old' | 'thisWeek' | 'thisMonth' | 'thisYear';
  amountRange: 'all' | 'small' | 'medium' | 'large' | 'veryLarge';
  currency: string;
  hasCategory: 'all' | 'with' | 'without';
  sortBy: 'date' | 'amount' | 'description' | 'category';
  sortOrder: 'asc' | 'desc';
  customAmountRanges: {
    small: { min: number; max: number };
    medium: { min: number; max: number };
    large: { min: number; max: number };
    veryLarge: { min: number; max: number };
  };
}

interface Category {
  _id: string;
  name: string;
  color: string;
  type: 'expense' | 'income';
}

export default function Transactions() {
  // Fonction pour envoyer des notifications par email pour les transactions
  const sendTransactionNotification = async (transaction, action) => {
    try {
      // Récupérer le profil utilisateur pour obtenir l'email
      const userProfile = await api.auth.getProfile();
      const userEmail = userProfile?.user?.email || 'utilisateur@example.com';
      
      // Déterminer le sujet et le message en fonction de l'action
      let subject = '';
      let message = '';
      
      const formattedAmount = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(parseFloat(transaction.amount));
      
      const categoryText = transaction.category ? ` dans la catégorie ${transaction.category}` : '';
      const dateText = new Date(transaction.timestamp || new Date()).toLocaleDateString('fr-FR');
      
      switch (action) {
        case 'create':
          subject = `Nouvelle ${transaction.type === 'income' ? 'entrée' : 'dépense'} enregistrée - BABOS`;
          message = `Une nouvelle ${transaction.type === 'income' ? 'entrée' : 'dépense'} de ${formattedAmount}${categoryText} a été enregistrée le ${dateText}.`;
          break;
        case 'update':
          subject = `Modification d'une transaction - BABOS`;
          message = `Votre ${transaction.type === 'income' ? 'entrée' : 'dépense'} de ${formattedAmount}${categoryText} a été modifiée le ${dateText}.`;
          break;
        case 'delete':
          subject = `Suppression d'une transaction - BABOS`;
          message = `Votre ${transaction.type === 'income' ? 'entrée' : 'dépense'} de ${formattedAmount}${categoryText} a été supprimée.`;
          break;
        default:
          subject = `Notification de transaction - BABOS`;
          message = `Une action a été effectuée sur votre transaction de ${formattedAmount}${categoryText}.`;
      }
      
      // Préparer les données de l'email
      const emailData = {
        to: userEmail,
        subject: subject,
        message: message,
        template: "transaction-notification",
        data: {
          username: userProfile?.user?.name || 'Utilisateur',
          transaction: {
            ...transaction,
            formattedAmount,
            formattedDate: dateText
          },
          action: action
        }
      };
      
      // Envoyer l'email via le service de notification
      await notificationService.sendEmail(emailData);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de transaction:', error);
      // On ne montre pas d'erreur à l'utilisateur pour ne pas interrompre son flux de travail
      // Les erreurs sont seulement loguées pour le debug
    }
  };
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // État pour les filtres
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    categoryId: '',
    type: 'all',
    dateRange: undefined,
    minAmount: '',
    maxAmount: '',
    status: 'all',
    amountRange: 'all',
    currency: 'all',
    hasCategory: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    customAmountRanges: {
      small: { min: 0, max: 50 },
      medium: { min: 50, max: 200 },
      large: { min: 200, max: 1000 },
      veryLarge: { min: 1000, max: Infinity }
    }
  });

  // Charger les catégories au montage du composant
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.categories.getAll();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        toast.error('Impossible de charger les catégories');
      }
    };
    
    loadCategories();
  }, []);

  // Charger les transactions au montage du composant
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Charger les transactions depuis l'API avec les filtres
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Charger toutes les transactions sans filtres côté serveur
      const response = await api.transactions.getAll();
      setTransactions(response.transactions);
      
      // Afficher l'état vide après un délai si aucune transaction
      setTimeout(() => {
        setShowEmptyState(response.transactions.length === 0);
      }, 500);
    } catch (error) {
      console.error("Erreur lors du chargement des transactions:", error);
      toast.error("Impossible de charger les transactions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOpenAddTransaction = (type: 'expense' | 'income') => {
    setTransactionType(type);
    setSelectedTransaction(null);
    setTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionType(transaction.type);
    setTransactionModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      await api.transactions.delete(transactionToDelete);
      setTransactions(prev => prev.filter(t => t._id !== transactionToDelete));
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      toast.success('Transaction supprimée avec succès');
      
      // Envoyer une notification de suppression
      const deletedTransaction = transactions.find(t => t._id === transactionToDelete);
      if (deletedTransaction) {
        await sendTransactionNotification(deletedTransaction, 'delete');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la transaction');
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setFilters(prev => ({ ...prev, categoryId }));
  };
  
  const handleTypeChange = (type: 'all' | 'expense' | 'income') => {
    setFilters(prev => ({ ...prev, type }));
  };
  
  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setFilters(prev => ({ ...prev, dateRange }));
  };
  
  const handleMinAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, minAmount: e.target.value }));
  };
  
  const handleMaxAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, maxAmount: e.target.value }));
  };

  // Nouvelles fonctions de gestion des filtres avancés
  const handleStatusChange = (status: TransactionFilters['status']) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleAmountRangeChange = (amountRange: TransactionFilters['amountRange']) => {
    setFilters(prev => ({ ...prev, amountRange }));
  };

  const handleCurrencyChange = (currency: string) => {
    setFilters(prev => ({ ...prev, currency }));
  };

  const handleHasCategoryChange = (hasCategory: TransactionFilters['hasCategory']) => {
    setFilters(prev => ({ ...prev, hasCategory }));
  };

  const handleSortByChange = (sortBy: TransactionFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleSortOrderChange = (sortOrder: TransactionFilters['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder }));
  };

  // Fonction générique pour gérer les changements de filtres
  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      categoryId: '',
      type: 'all',
      dateRange: undefined,
      minAmount: '',
      maxAmount: '',
      status: 'all',
      amountRange: 'all',
      currency: 'all',
      hasCategory: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      customAmountRanges: {
        small: { min: 0, max: 50 },
        medium: { min: 50, max: 200 },
        large: { min: 200, max: 1000 },
        veryLarge: { min: 1000, max: Infinity }
      }
    });
  };

  // Fonction pour compter les filtres actifs
  const getFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.categoryId) count++;
    if (filters.type !== 'all') count++;
    if (filters.currency !== 'all') count++;
    if (filters.hasCategory !== 'all') count++;
    if (filters.amountRange !== 'all') count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateRange?.from) count++;
    return count;
  };

  // Fonction pour filtrer et trier les transactions
  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    // Filtre par recherche
    if (filters.search) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        (t.category?.name.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Filtre par catégorie
    if (filters.categoryId) {
      filtered = filtered.filter(t => t.category?._id === filters.categoryId);
    }

    // Filtre par type
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filtre par devise
    if (filters.currency !== 'all') {
      filtered = filtered.filter(t => t.currency === filters.currency);
    }

    // Filtre par présence de catégorie
    if (filters.hasCategory === 'with') {
      filtered = filtered.filter(t => t.category !== null);
    } else if (filters.hasCategory === 'without') {
      filtered = filtered.filter(t => t.category === null);
    }

    // Filtre par plage de montant prédéfinie
    if (filters.amountRange !== 'all') {
      const range = filters.customAmountRanges[filters.amountRange];
      filtered = filtered.filter(t => {
        const amount = Math.abs(t.amount);
        return amount >= range.min && (range.max === Infinity ? true : amount <= range.max);
      });
    }

    // Filtre par montant personnalisé
    if (filters.minAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => Math.abs(t.amount) <= parseFloat(filters.maxAmount));
    }

    // Filtre par plage de dates personnalisée
    if (filters.dateRange?.from) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const fromDate = filters.dateRange!.from;
        const toDate = filters.dateRange!.to || filters.dateRange!.from;
        return transactionDate >= fromDate && transactionDate <= toDate;
      });
    }

    // Filtre par statut temporel
    if (filters.status !== 'all') {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        switch (filters.status) {
          case 'recent':
            return transactionDate >= oneWeekAgo;
          case 'old':
            return transactionDate < oneMonthAgo;
          case 'thisWeek':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return transactionDate >= startOfWeek;
          case 'thisMonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return transactionDate >= startOfMonth;
          case 'thisYear':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return transactionDate >= startOfYear;
          default:
            return true;
        }
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredTransactions = getFilteredAndSortedTransactions();

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Fonction de gestion de l'export
  const handleExport = async (type: 'pdf' | 'csv', dateRange?: DateRange) => {
    try {
      // Récupérer le profil utilisateur
      const userProfile = await api.auth.getProfile();
      
      // Filtrer les transactions selon la période si spécifiée
      let transactionsToExport = transactions;
      if (dateRange?.from) {
        transactionsToExport = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          const fromDate = dateRange.from;
          const toDate = dateRange.to || dateRange.from;
          return transactionDate >= fromDate && transactionDate <= toDate;
        });
      }
      
      await exportService.exportTransactions(transactionsToExport, type, userProfile, dateRange);
      toast.success(`${type.toUpperCase()} généré avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de la génération du fichier');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="space-y-4">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos revenus et dépenses
            </p>
          </div>
        <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleOpenAddTransaction('income')}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
            >
              <TrendingUp size={16} className="mr-2" /> Nouveau revenu
          </Button>
            <Button 
              onClick={() => handleOpenAddTransaction('expense')}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <TrendingDown size={16} className="mr-2" /> Nouvelle dépense
          </Button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenus</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    <CurrencyDisplay amount={totalIncome} fromCurrency="EUR" />
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Dépenses</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    <CurrencyDisplay amount={totalExpenses} fromCurrency="EUR" />
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Solde Net</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    totalIncome - totalExpenses >= 0 
                      ? "text-green-700 dark:text-green-300" 
                      : "text-red-700 dark:text-red-300"
                  )}>
                    <CurrencyDisplay amount={totalIncome - totalExpenses} fromCurrency="EUR" />
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtres modernisés */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Barre de recherche et boutons */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher des transactions..."
                  className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="h-11 px-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres avancés
                {getFilterCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {getFilterCount()}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="h-11 px-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filtres avancés */}
            {isFiltersExpanded && (
              <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Première ligne de filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Type de transaction */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Type
                    </label>
                    <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="expense">Dépenses</SelectItem>
                        <SelectItem value="income">Revenus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Devise */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Devise
                    </label>
                    <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Toutes les devises" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les devises</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Présence de catégorie */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Catégorisation
                  </label>
                    <Select value={filters.hasCategory} onValueChange={(value) => handleFilterChange('hasCategory', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        <SelectItem value="with">Avec catégorie</SelectItem>
                        <SelectItem value="without">Sans catégorie</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                
                  {/* Tri par */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Trier par
                  </label>
                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Montant</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="category">Catégorie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Deuxième ligne de filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Statut temporel */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                    Période
                  </label>
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="recent">Récentes (7 jours)</SelectItem>
                        <SelectItem value="old">Anciennes (&gt;30 jours)</SelectItem>
                        <SelectItem value="thisWeek">Cette semaine</SelectItem>
                        <SelectItem value="thisMonth">Ce mois</SelectItem>
                        <SelectItem value="thisYear">Cette année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plage de montant */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Plage de montant
                    </label>
                    <Select value={filters.amountRange} onValueChange={(value) => handleFilterChange('amountRange', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les montants</SelectItem>
                        <SelectItem value="small">Petits (&lt; 50€)</SelectItem>
                        <SelectItem value="medium">Moyens (50-200€)</SelectItem>
                        <SelectItem value="large">Gros (200-1000€)</SelectItem>
                        <SelectItem value="veryLarge">Très gros (&gt;1000€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordre de tri */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      Ordre
                    </label>
                    <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Décroissant</SelectItem>
                        <SelectItem value="asc">Croissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catégorie */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Catégorie
                    </label>
                    <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        {categories
                          .filter(cat => filters.type === 'all' || cat.type === filters.type)
                          .map(category => (
                            <SelectItem key={category._id} value={category._id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Troisième ligne - Montants personnalisés */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant minimum
                    </label>
                    <Input
                      type="number"
                      placeholder="Montant min"
                      className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant maximum
                    </label>
                    <Input
                      type="number"
                      placeholder="Montant max"
                      className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    />
                  </div>
                </div>

                {/* Quatrième ligne - Sélecteur de plage de dates */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Plage de dates personnalisée
                  </label>
                  <DateRangeSelector
                    dateRange={filters.dateRange}
                    onDateRangeChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
                    className="w-full"
                  />
                </div>
                
                {/* Résumé des filtres actifs */}
                {getFilterCount() > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
                    {filters.type !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {filters.type === 'expense' ? 'Dépenses' : 'Revenus'}
                      </Badge>
                    )}
                    {filters.categoryId && (
                      <Badge variant="secondary" className="text-xs">
                        Catégorie sélectionnée
                      </Badge>
                    )}
                    {filters.currency !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Devise: {filters.currency}
                      </Badge>
                    )}
                    {filters.hasCategory !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.hasCategory === 'with' ? 'Avec catégorie' : 'Sans catégorie'}
                      </Badge>
                    )}
                    {filters.status !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Période filtrée
                      </Badge>
                    )}
                    {filters.amountRange !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Plage de montant
                      </Badge>
                    )}
                    {(filters.minAmount || filters.maxAmount) && (
                      <Badge variant="secondary" className="text-xs">
                        Montant personnalisé
                      </Badge>
                    )}
                    {filters.dateRange?.from && (
                      <Badge variant="secondary" className="text-xs">
                        Plage de dates
                      </Badge>
                    )}
                </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Historique des transactions</CardTitle>
              <CardDescription className="mt-1">
                {isLoading ? "Chargement..." : `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} trouvée${filteredTransactions.length !== 1 ? 's' : ''} sur ${transactions.length} total`}
          </CardDescription>
              {getFilterCount() > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                    <Filter className="h-3 w-3 mr-1" />
                    {getFilterCount()} filtre{getFilterCount() > 1 ? 's' : ''} actif{getFilterCount() > 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Effacer
                  </Button>
                </div>
              )}
            </div>
            <ExportActions
              transactions={transactions}
              onExport={handleExport}
              isLoading={isLoading}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-muted-foreground">Chargement des transactions...</p>
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <EyeOff className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucune transaction trouvée
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Aucune transaction ne correspond aux critères de recherche.
              </p>
              <Button onClick={resetFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800 p-4 font-medium text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Catégorie</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2 text-right">Montant</div>
                <div className="col-span-2 text-right">Actions</div>
                </div>
              {filteredTransactions.map((transaction, index) => (
                  <div 
                    key={transaction._id} 
                  className="grid grid-cols-12 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                  <div className="col-span-4 truncate font-medium">
                    {transaction.description}
                  </div>
                  <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {transaction.category ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: transaction.category.color || '#ccc' }}
                            />
                          <span className="text-sm">{transaction.category.name}</span>
                          </>
                        ) : (
                        <span className="text-sm text-muted-foreground">Non catégorisé</span>
                        )}
                      </div>
                    </div>
                  <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(transaction.date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="col-span-2 text-right">
                      <CurrencyDisplay 
                        amount={Math.abs(transaction.amount)} 
                      fromCurrency={transaction.currency}
                        className={cn(
                        transaction.type === 'expense' ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400",
                        "font-semibold"
                        )}
                      />
                    </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditTransaction(transaction)}
                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    >
                      <Edit size={14} />
                      </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(transaction._id)}
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={14} />
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'ajout/modification de transaction */}
      <TransactionModal 
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSuccess={() => fetchTransactions()}
        defaultType={transactionType}
        transaction={selectedTransaction}
      />

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
