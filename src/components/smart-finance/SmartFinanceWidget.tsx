import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BadgeDollarSign, Landmark, LineChart, 
  BellDot, ArrowUpCircle, ArrowDownCircle, 
  Cog, HelpCircle, CheckCircle, Loader2, Target, Plus
} from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatCurrency } from '@/utils/formatters';
import { statisticsService } from '@/services/statisticsService';
import { Progress } from '@/components/ui/progress';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import SavingsGoalModal from '../SavingsGoalModal';
import { toast } from 'sonner';

interface SmartFinanceData {
  savingsStats: {
    totalGoals: number;
    totalTarget: number;
    totalCurrent: number;
    totalProgress: number;
    totalRemaining: number;
    totalMonthlyContribution: number;
    totalSuggestedContribution: number;
  } | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  recommendations: {
    id: number;
    title: string;
    description: string;
    potential: number;
    icon: React.FC<{ className?: string }>;
  }[];
}

const SmartFinanceWidget = () => {
  const [data, setData] = useState<SmartFinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  useEffect(() => {
    fetchFinanceData();
  }, []);

    const fetchFinanceData = async () => {
      setIsLoading(true);
      try {
        // Récupérer les données sommaires (revenus et dépenses)
        const summary = await statisticsService.getSummary();
      
      // Récupérer les statistiques d'épargne
      let savingsStats = null;
      try {
        const savingsResponse = await api.savingsGoals.getStats();
        savingsStats = savingsResponse.stats;
      } catch (error) {
        console.log('Aucun objectif d\'épargne trouvé');
      }
        
        // Récupérer les transactions récentes pour l'analyse
        const transactionsResponse = await api.transactions.getAll();
        const transactions = transactionsResponse.transactions || [];
        
      // Générer des recommandations basées sur les données réelles
        const recommendations = [
          {
            id: 1,
            title: "Réduire les abonnements",
            description: "Économisez en optimisant vos abonnements",
            potential: Math.round(summary.totalExpense * 0.02), // 2% des dépenses
            icon: ArrowDownCircle
          },
          {
            id: 2,
            title: "Automatiser votre épargne",
            description: "Épargnez 10% de vos revenus automatiquement",
            potential: Math.round(summary.totalIncome * 0.1), // 10% des revenus
            icon: Landmark
          },
          {
            id: 3,
            title: "Optimiser vos assurances",
            description: "Économisez sur vos assurances",
            potential: Math.round(summary.totalExpense * 0.05), // 5% des dépenses
            icon: BadgeDollarSign
          }
        ];
        
        setData({
        savingsStats,
          monthlyIncome: summary.totalIncome,
          monthlyExpenses: summary.totalExpense,
          recommendations
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données financières:', error);
        // En cas d'erreur, utiliser des données de démonstration
        setData({
        savingsStats: null,
          monthlyIncome: 3200,
          monthlyExpenses: 2450,
          recommendations: [
            {
              id: 1,
              title: "Réduire les abonnements",
              description: "Économisez 45€/mois en optimisant vos abonnements",
              potential: 45,
              icon: ArrowDownCircle
            },
            {
              id: 2,
              title: "Automatiser votre épargne",
              description: "Épargnez 10% de vos revenus automatiquement",
              potential: 320,
              icon: Landmark
            },
            {
              id: 3,
              title: "Optimiser vos assurances",
              description: "Économisez jusqu'à 200€/an sur vos assurances",
              potential: 17,
              icon: BadgeDollarSign
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

  const handleGoalUpdated = () => {
    fetchFinanceData();
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Analyse de vos données financières...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <LineChart className="h-5 w-5 text-primary" />
          <span>Finance Intelligente</span>
        </CardTitle>
        <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={() => setShowSavingsModal(true)}
            >
              <Target className="h-4 w-4" />
            </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors">
            <BellDot className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors">
            <Cog className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
              {/* Objectifs d'épargne */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center">
                    Objectifs d'épargne
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                          <h4 className="font-medium text-sm">Objectifs d'épargne</h4>
                        <p className="text-sm text-muted-foreground">
                            Suivez vos objectifs d'épargne et obtenez des recommandations personnalisées.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavingsModal(true)}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Gérer
                  </Button>
              </div>
              
                {data.savingsStats ? (
                  <>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <Progress value={data.savingsStats.totalProgress} className="h-full" />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Épargné: {formatCurrency(data.savingsStats.totalCurrent)}</span>
                      <span>Objectif: {formatCurrency(data.savingsStats.totalTarget)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">{data.savingsStats.totalProgress.toFixed(1)}% atteint</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(data.savingsStats.totalSuggestedContribution)}/mois suggéré
                      </span>
              </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun objectif d'épargne défini</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSavingsModal(true)}
                      className="mt-2"
                    >
                      Créer un objectif
                    </Button>
                  </div>
                )}
            </div>
            
              {/* Revenus et dépenses */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenus mensuels</span>
                <span className="font-bold text-base text-success flex items-center gap-1">
                  <ArrowUpCircle className="h-4 w-4" />
                  {formatCurrency(data.monthlyIncome)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dépenses mensuelles</span>
                <span className="font-bold text-base text-destructive flex items-center gap-1">
                  <ArrowDownCircle className="h-4 w-4" />
                  {formatCurrency(data.monthlyExpenses)}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium">Solde</span>
                <span className={cn("font-bold text-base", data.monthlyIncome - data.monthlyExpenses >= 0 
                  ? "text-success" 
                  : "text-destructive"
                )}>
                  {formatCurrency(data.monthlyIncome - data.monthlyExpenses)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-3">Recommandations personnalisées</h3>
            <div className="space-y-3">
              {data.recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className="rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <rec.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{rec.title}</span>
                    </div>
                    <span className="text-xs font-medium text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {formatCurrency(rec.potential)}/mois
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-7">
                    {rec.description}
                  </p>
                </div>
              ))}
              
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-8 hover:bg-primary/5 transition-colors">
                Voir toutes les recommandations
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

      <SavingsGoalModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        onGoalUpdated={handleGoalUpdated}
      />
    </>
  );
};

export default SmartFinanceWidget;
