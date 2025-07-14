
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingDown, TrendingUp, DollarSign, PiggyBank } from "lucide-react";
import { statisticsService } from '@/services/statisticsService';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

export function StatsSummaryCards() {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    savingsRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await statisticsService.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Erreur lors du chargement du résumé:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              <CurrencyDisplay amount={summary.totalIncome} showSymbol={true} />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              `+${(summary.totalIncome * 0.05).toFixed(2)}€ depuis le dernier mois`
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Dépenses du mois</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              <CurrencyDisplay amount={summary.totalExpense} showSymbol={true} />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              `${(summary.totalExpense * 0.03).toFixed(2)}€ de moins que le mois dernier`
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Solde actuel</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              <CurrencyDisplay 
                amount={summary.balance} 
                className={summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}
                showSymbol={true}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? (
              <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
            ) : (
              <span className="flex items-center">
                {summary.balance >= 0 ? '+' : ''}
                <CurrencyDisplay 
                  amount={Math.abs(summary.balance)} 
                  className={summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}
                  showSymbol={true}
                />
                <span className="ml-1 text-muted-foreground">ce mois-ci</span>
              </span>
            )}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Taux d'épargne</CardTitle>
          <PiggyBank className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
              `${summary.savingsRate.toFixed(1)}%`
            )}
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-2 w-full bg-muted animate-pulse rounded"></div>
            ) : (
              <Progress value={summary.savingsRate} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
