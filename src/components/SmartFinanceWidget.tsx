import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BadgeDollarSign, Landmark, LineChart, 
  BellDot, ArrowUpCircle, ArrowDownCircle, 
  Cog, HelpCircle, CheckCircle, Loader2,
  TrendingUp, TrendingDown, Target, Calendar,
  PiggyBank, Shield, Plane, Zap, Lightbulb,
  AlertTriangle, Info, Star, Rocket, Plus,
  BarChart, Wallet, CreditCard, Gift, 
  Clock, Award, TrendingUpIcon, DollarSign,
  Eye, Settings, Sparkles, Brain, Target as TargetIcon
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { api } from '@/services/api';
import { toast } from 'sonner';
import SavingsGoalModal from './SavingsGoalModal';

interface SmartFinanceData {
  summary: {
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
  savingsRate: number;
  subscriptionTotal: number;
  subscriptionCount: number;
    monthlyIncomeCount: number;
    monthlyExpenseCount: number;
    isSummaryEstimated: boolean;
  };
  projections: {
    emergencyFund: {
      target: number;
      monthlyContribution: number;
      monthsToComplete: number;
    };
    retirementSavings: {
      target: number;
      monthlyContribution: number;
      monthsToComplete: number;
    };
    vacationSavings: {
      target: number;
      monthlyContribution: number;
      monthsToComplete: number;
    };
    discretionaryIncome: number;
    potentialMonthlySavings: number;
  };
  recommendations: Array<{
  id: number;
  title: string;
  description: string;
  potential: number;
  type: string;
    priority: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    message: string;
    icon: string;
    color: string;
  }>;
  savingsGoal: any;
  subscriptions: Array<any>;
}

const SmartFinanceWidget = () => {
  const [data, setData] = useState<SmartFinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setIsLoading(true);
      try {
      const smartFinanceData = await api.finance.getSmartFinanceData();
      setData(smartFinanceData);
      } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

  const handleCreateSavingsGoal = () => {
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSavingsGoal = () => {
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleGoalUpdated = () => {
    fetchData();
  };

  const handleSaveSavingsGoal = async (goalData: any) => {
    try {
      if (modalMode === 'create') {
        await api.finance.createSavingsGoal(goalData);
      } else {
        await api.finance.updateSavingsGoal(data?.savingsGoal?._id, goalData);
      }
      await handleGoalUpdated();
      toast.success('Objectif d\'épargne sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  };

  const handleUpdateSavingsAmount = async (newAmount: number) => {
    if (!data?.savingsGoal?._id) return;
    
    setIsUpdatingAmount(true);
    try {
      await api.finance.updateSavingsAmount(data.savingsGoal._id, { currentAmount: newAmount });
      await fetchData();
      toast.success('Montant mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  const handleQuickAdd = (amount: number) => {
    if (!data?.savingsGoal) return;
    const newAmount = data.savingsGoal.currentAmount + amount;
    handleUpdateSavingsAmount(newAmount);
  };

  const getIconForRecommendationType = (type: string) => {
    switch (type) {
      case 'subscription_optimization': return ArrowDownCircle;
      case 'automatic_savings': return Landmark;
      case 'savings_improvement': return PiggyBank;
      case 'expense_reduction': return TrendingDown;
      case 'getting_started': return Rocket;
      case 'savings_goal': return Target;
      case 'emergency_fund': return Shield;
      default: return BadgeDollarSign;
    }
  };

  const getRecommendationColor = (type: string, priority: string) => {
    const baseColors = {
      subscription_optimization: 'text-orange-600 bg-orange-50 border-orange-200',
      automatic_savings: 'text-green-600 bg-green-50 border-green-200',
      savings_improvement: 'text-blue-600 bg-blue-50 border-blue-200',
      expense_reduction: 'text-red-600 bg-red-50 border-red-200',
      getting_started: 'text-purple-600 bg-purple-50 border-purple-200',
      savings_goal: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      emergency_fund: 'text-amber-600 bg-amber-50 border-amber-200'
    };
    
    return baseColors[type as keyof typeof baseColors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getInsightIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-up': return TrendingUp;
      case 'receipt': return BadgeDollarSign;
      case 'calendar': return Calendar;
      case 'piggy-bank': return PiggyBank;
      case 'alert-triangle': return AlertTriangle;
      default: return Info;
    }
  };

  const getInsightColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-50 border-green-200';
      case 'orange': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'red': return 'text-red-600 bg-red-50 border-red-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'blue': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Analyse en cours...</h3>
              <p className="text-slate-600 dark:text-slate-400">Chargement de vos données financières intelligentes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Aucune donnée disponible</h3>
              <p className="text-slate-600 dark:text-slate-400">Ajoutez des transactions pour commencer l'analyse intelligente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, projections, recommendations, insights, savingsGoal, subscriptions } = data;

  return (
    <>
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        {/* En-tête principal avec design moderne */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-2xl border-0 shadow-lg">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Brain className="h-8 w-8" />
              Finance Intelligente
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">Gérez vos finances avec des insights personnalisés et des recommandations avancées</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
              {summary.subscriptionCount} abonnements actifs
            </Badge>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
              <BellDot className="h-5 w-5" />
          </Button>
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
              <Settings className="h-5 w-5" />
          </Button>
          </div>
        </div>

        {/* Section Objectif d'épargne - PRINCIPALE avec design sophistiqué */}
            {savingsGoal && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
            <CardHeader className="pb-6 relative z-10">
                <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <TargetIcon className="h-6 w-6" />
                  Objectif d'épargne
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditSavingsGoal}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    onClick={handleCreateSavingsGoal}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel objectif
                        </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Montant actuel</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <CurrencyDisplay amount={savingsGoal.currentAmount} fromCurrency="EUR" />
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Objectif</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    <CurrencyDisplay amount={savingsGoal.targetAmount} fromCurrency="EUR" />
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">Contribution suggérée</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    <CurrencyDisplay amount={savingsGoal.projectedCompletion.monthlyContribution} fromCurrency="EUR" />
                    <span className="text-lg text-purple-600 dark:text-purple-400">/mois</span>
                  </p>
                </div>
              </div>
              
              {/* Barre de progression moderne */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progression</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={(savingsGoal.currentAmount / savingsGoal.targetAmount) * 100} 
                    className="h-3 bg-slate-200 dark:bg-slate-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full h-3 opacity-20"></div>
                </div>
                </div>
                
              {/* Actions rapides */}
              <div className="mt-6 flex flex-wrap gap-3">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAdd(amount)}
                    disabled={isUpdatingAmount}
                    className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    +{amount}€
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résumé financier avec cartes modernes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Revenus mensuels</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                <CurrencyDisplay amount={summary.monthlyIncome} fromCurrency="EUR" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {summary.monthlyIncomeCount} transactions ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Dépenses mensuelles</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                <CurrencyDisplay amount={summary.monthlyExpenses} fromCurrency="EUR" />
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {summary.monthlyExpenseCount} transactions ce mois
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Abonnements</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                <CurrencyDisplay amount={summary.subscriptionTotal} fromCurrency="EUR" />
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {summary.subscriptionCount} abonnements actifs
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Solde</CardTitle>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'}`}>
                <CurrencyDisplay amount={summary.balance} fromCurrency="EUR" />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {summary.savingsRate.toFixed(1)}% d'épargne
              </p>
            </CardContent>
          </Card>
          </div>
          
        {/* Recommandations et Insights en grille moderne */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommandations */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommandations intelligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recommendations.slice(0, 4).map((rec, index) => {
                  const Icon = getIconForRecommendationType(rec.type);
                  return (
                    <div 
                      key={rec.id} 
                      className="group relative overflow-hidden p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-purple-500 to-pink-600">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{rec.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{rec.description}</p>
                      <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              Potentiel: <CurrencyDisplay amount={rec.potential} fromCurrency="EUR" />/mois
                            </span>
                            <Button variant="outline" size="sm" className="px-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                              Appliquer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Insights financiers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {insights.slice(0, 4).map((insight, index) => {
                  const Icon = getInsightIcon(insight.icon);
                  return (
                    <div 
                      key={index} 
                      className="group relative overflow-hidden p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-start gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br from-blue-500 to-indigo-600">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{insight.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{insight.message}</p>
                        </div>
            </div>
          </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abonnements avec design moderne */}
        {subscriptions && subscriptions.length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Abonnements actifs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.slice(0, 6).map((subscription, index) => (
                  <div 
                    key={subscription._id} 
                    className="group relative overflow-hidden p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/20 dark:hover:to-teal-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{subscription.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{subscription.category?.name || 'Sans catégorie'}</p>
                      </div>
                      <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        <CurrencyDisplay amount={subscription.amount} fromCurrency="EUR" />
                      </span>
                    </div>
                  </div>
                ))}
        </div>
      </CardContent>
    </Card>
        )}
      </div>

      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoalUpdated={handleGoalUpdated}
        mode={modalMode}
        initialData={data?.savingsGoal}
      />
    </>
  );
};

export default SmartFinanceWidget;
