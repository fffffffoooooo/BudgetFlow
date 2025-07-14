import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import SmartFinanceWidget from '../components/SmartFinanceWidget';
import { formatCurrency } from '../utils/formatters';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Landmark, Receipt, PiggyBank, Calendar, TrendingUp, Rocket, BarChart, AlertTriangle, Plus, Target, Loader2, Lightbulb, Star, Shield, Plane } from "lucide-react";
import { api } from '@/services/api';
import { toast } from 'sonner';
import SavingsGoalModal from '../components/SavingsGoalModal';

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

const SmartFinance: React.FC = () => {
  const [data, setData] = useState<SmartFinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      const smartFinanceData = await api.finance.getSmartFinanceData();
      setData(smartFinanceData);
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast.error('Erreur lors du chargement des données financières');
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
    fetchFinanceData();
  };

  const handleSaveSavingsGoal = async (goalData: any) => {
    try {
      await api.finance.createSavingsGoal(goalData);
      await fetchFinanceData();
      toast.success('Objectif d\'épargne sauvegardé avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'objectif:', error);
      throw error;
    }
  };

  const handleUpdateSavingsAmount = async (newAmount: number) => {
    if (!data?.savingsGoal) return;
    
    try {
      await api.finance.createSavingsGoal({
        title: data.savingsGoal.title,
        targetAmount: data.savingsGoal.targetAmount,
        deadline: data.savingsGoal.deadline?.toISOString(),
        description: data.savingsGoal.description || '',
        currentAmount: newAmount
      });
      
      await fetchFinanceData();
      toast.success('Montant mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du montant:', error);
      toast.error('Erreur lors de la mise à jour du montant');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <PageHeader 
          title="Finance Intelligente" 
          subtitle="Optimisez votre gestion financière avec des outils intelligents et des analyses personnalisées"
        />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <PageHeader 
          title="Finance Intelligente" 
          subtitle="Optimisez votre gestion financière avec des outils intelligents et des analyses personnalisées"
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const { summary, projections, recommendations, insights, savingsGoal, subscriptions } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Finance Intelligente" 
        subtitle="Optimisez votre gestion financière avec des outils intelligents et des analyses personnalisées"
      />
      
      {/* Résumé financier */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden card-hover">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Revenus mensuels</p>
                <p className="text-2xl md:text-3xl font-bold text-green-500 dark:text-green-400 animate-in fade-in-50 slide-in-from-left-3 duration-500">
                  {formatCurrency(summary.monthlyIncome)}
                </p>
                <p className="text-xs text-muted-foreground">{summary.monthlyIncomeCount} transactions</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden card-hover">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dépenses mensuelles</p>
                <p className="text-2xl md:text-3xl font-bold text-red-500 dark:text-red-400 animate-in fade-in-50 slide-in-from-left-3 duration-500 delay-100">
                  {formatCurrency(summary.monthlyExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">{summary.monthlyExpenseCount} transactions</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden card-hover">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Solde mensuel</p>
                <p className={`text-2xl md:text-3xl font-bold animate-in fade-in-50 slide-in-from-left-3 duration-500 delay-200 ${
                  summary.balance >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-red-500 dark:text-red-400'
                }`}>
                  {formatCurrency(summary.balance)}
                </p>
                <p className="text-xs text-muted-foreground">Taux d'épargne: {summary.savingsRate.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <PiggyBank className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden card-hover">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Abonnements ({summary.subscriptionCount})</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-500 dark:text-amber-400 animate-in fade-in-50 slide-in-from-left-3 duration-500 delay-300">
                  {formatCurrency(summary.subscriptionTotal)}
                </p>
                <p className="text-xs text-muted-foreground">Actifs ce mois</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Widget de finance intelligente */}
        <div className="md:col-span-8 animate-in zoom-in-50 duration-700 delay-300">
          <SmartFinanceWidget />
        </div>
        
        {/* Informations supplémentaires */}
        <div className="md:col-span-4 space-y-6 animate-in zoom-in-50 duration-700 delay-500">
          {/* Objectif d'épargne enrichi */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Objectif d'épargne</span>
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCreateSavingsGoal}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {savingsGoal ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{savingsGoal.title}</h3>
                    <span className="font-bold text-xs text-primary">{savingsGoal.progress.toFixed(1)}%</span>
                  </div>
                  
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out" 
                      style={{ width: `${Math.min(savingsGoal.progress, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Actuel: {formatCurrency(savingsGoal.currentAmount)}</span>
                    <span>Objectif: {formatCurrency(savingsGoal.targetAmount)}</span>
                  </div>
                  
                  {savingsGoal.projectedCompletion && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-900">Projection</span>
                      </div>
                      <p className="text-xs text-blue-700">{savingsGoal.projectedCompletion.message}</p>
                      {savingsGoal.projectedCompletion.monthlyContribution > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Contribution suggérée: {formatCurrency(savingsGoal.projectedCompletion.monthlyContribution)}/mois
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditSavingsGoal}
                      className="flex-1"
                    >
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const newAmount = prompt('Nouveau montant actuel:', savingsGoal.currentAmount.toString());
                        if (newAmount !== null) {
                          const amount = parseFloat(newAmount);
                          if (!isNaN(amount) && amount >= 0) {
                            handleUpdateSavingsAmount(amount);
                          } else {
                            toast.error('Montant invalide');
                          }
                        }
                      }}
                      className="flex-1"
                    >
                      Mettre à jour
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
                    <PiggyBank className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="font-medium text-blue-900 mb-2">Lancez-vous dans l'épargne !</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Vous n'avez pas encore d'objectif ? Créez-en un dès maintenant pour mieux gérer votre avenir financier !
                    </p>
                    <Button 
                      onClick={handleCreateSavingsGoal}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Créer un objectif
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Projections financières */}
          {projections.discretionaryIncome > 0 && (
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Projections financières</span>
                </h2>
                
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Fonds d'urgence</span>
                      </div>
                      <span className="text-xs font-bold text-green-600">
                        {formatCurrency(projections.emergencyFund.target)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      {projections.emergencyFund.monthsToComplete} mois pour l'atteindre
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Épargne retraite</span>
                      </div>
                      <span className="text-xs font-bold text-blue-600">
                        {formatCurrency(projections.retirementSavings.target)}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {formatCurrency(projections.retirementSavings.monthlyContribution)}/mois
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Fonds de voyage</span>
                      </div>
                      <span className="text-xs font-bold text-purple-600">
                        {formatCurrency(projections.vacationSavings.target)}
                      </span>
                    </div>
                    <p className="text-xs text-purple-700">
                      {formatCurrency(projections.vacationSavings.monthlyContribution)}/mois
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Insights personnalisés */}
          {insights.length > 0 && (
            <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span>Insights personnalisés</span>
                </h2>
                
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Paiements à venir */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Paiements à venir</span>
              </h2>
              
              {subscriptions.length > 0 ? (
                <div className="space-y-3">
                  {subscriptions.slice(0, 3).map((subscription) => (
                    <div key={subscription._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subscription.category?.color || '#6b7280' }}
                        />
                        <div>
                          <p className="font-medium text-sm">{subscription.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(subscription.nextPaymentDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm">{formatCurrency(subscription.amount)}</span>
                    </div>
                  ))}
                  {subscriptions.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{subscriptions.length - 3} autres paiements
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun paiement à venir</p>
                </div>
              )}
            </div>
          </Card>

          {/* Fonctionnalités intelligentes */}
          <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <span>Fonctionnalités intelligentes</span>
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Rappels de paiement intelligents</p>
                    <p className="text-sm text-muted-foreground">Recevez des notifications avant vos échéances</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Détection automatique de transactions</p>
                    <p className="text-sm text-muted-foreground">Identification des paiements récurrents</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <Landmark className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Répartition automatique des revenus</p>
                    <p className="text-sm text-muted-foreground">Distribution intelligente à la réception des revenus</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <PiggyBank className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Suggestions d'économies</p>
                    <p className="text-sm text-muted-foreground">Conseils personnalisés pour optimiser vos finances</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Prévisions financières</p>
                    <p className="text-sm text-muted-foreground">Visualisez vos finances futures basées sur vos habitudes</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <BarChart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Analyses avancées</p>
                    <p className="text-sm text-muted-foreground">Comprendre vos habitudes de dépenses et d'économies</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Détection des anomalies</p>
                    <p className="text-sm text-muted-foreground">Identification des transactions inhabituelles ou suspectes</p>
                  </div>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal pour les objectifs d'épargne */}
      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGoalUpdated={handleGoalUpdated}
        initialData={savingsGoal}
        mode={modalMode}
      />
    </div>
  );
};

export default SmartFinance;
