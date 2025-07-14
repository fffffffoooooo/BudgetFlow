import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Loader2, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from '@/utils/formatters';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  date: string;
  type: 'expense' | 'income';
  currency?: string;
  originalAmount?: number;
  originalCurrency?: string;
  category: Category;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await api.transactions.getAll({ limit: 5 });
        setTransactions(response.transactions);
      } catch (error) {
        console.error('Erreur lors du chargement des transactions récentes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  const { currency: currentCurrency } = useCurrency();

  // Fonction pour déterminer si nous devons afficher la devise d'origine
  const shouldShowOriginalCurrency = (transaction: Transaction) => {
    return transaction.currency && transaction.currency !== currentCurrency;
  };

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Transactions récentes</CardTitle>
          <p className="text-xs text-muted-foreground">Montants affichés en {currentCurrency}</p>
        </div>
        <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('/transactions')}>
          Voir tout
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Chargement des transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center gap-3 p-2 hover:bg-accent/20 rounded-lg transition-colors">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    transaction.type === 'income' 
                      ? "bg-green-50 dark:bg-green-900/20" 
                      : "bg-red-50 dark:bg-red-900/20"
                  )}
                >
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{transaction.description}</p>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.date, "short")}
                    </span>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: transaction.category?.color || '#ccc' }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {transaction.category?.name || 'Non catégorisé'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className={cn(
                    "font-medium",
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    <CurrencyDisplay 
                      amount={transaction.amount} 
                      originalCurrency={transaction.originalCurrency || transaction.currency}
                      className={transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                    />
                  </div>
                  {shouldShowOriginalCurrency(transaction) && (
                    <div className="text-xs text-muted-foreground">
                      <CurrencyDisplay 
                        amount={transaction.originalAmount || transaction.amount} 
                        originalCurrency={transaction.currency}
                        className="text-muted-foreground"
                        showCode={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg font-medium">Aucune transaction récente</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des transactions pour les voir apparaître ici
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/add-transaction')}
            >
              Ajouter une transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
