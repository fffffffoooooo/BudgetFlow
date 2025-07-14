
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from '@/utils/formatters';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
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
  category: Category;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function RecentTransactionsCard({ transactions, loading = false }: RecentTransactionsProps) {
  const demoTransactions = [
    {
      _id: '1',
      description: 'Supermarché',
      amount: 85.20,
      date: '2023-05-24',
      type: 'expense',
      currency: 'EUR',
      category: { _id: '1', name: 'Alimentation', color: '#3b82f6' }
    },
    {
      _id: '2',
      description: 'Salaire',
      amount: 2300,
      date: '2023-05-01',
      type: 'income',
      currency: 'EUR',
      category: { _id: '5', name: 'Revenus', color: '#10b981' }
    },
    {
      _id: '3',
      description: 'Restaurant',
      amount: 45.50,
      date: '2023-05-22',
      type: 'expense',
      currency: 'EUR',
      category: { _id: '6', name: 'Loisirs', color: '#8b5cf6' }
    },
    {
      _id: '4',
      description: 'Essence',
      amount: 60,
      date: '2023-05-20',
      type: 'expense',
      currency: 'EUR',
      category: { _id: '3', name: 'Transport', color: '#f59e0b' }
    }
  ];

  // Utiliser les transactions fournies ou les données de démonstration
  const displayTransactions = (transactions && transactions.length > 0) ? transactions : demoTransactions;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayTransactions.map((transaction) => (
        <div key={transaction._id} className="flex items-center gap-3">
          <div 
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              transaction.type === 'income' 
                ? "bg-green-50 dark:bg-green-900/20" 
                : "bg-red-50 dark:bg-red-900/20"
            )}
          >
            {transaction.type === 'income' ? (
              <ArrowUpRight className="h-5 w-5 text-success" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{transaction.description}</p>
            <div className="flex items-center gap-2">
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
          <span className={cn("font-medium", transaction.type === 'income' ? "text-success" : "text-destructive")}>
            <CurrencyDisplay 
              amount={Math.abs(transaction.amount)} 
              originalCurrency={transaction.currency}
              className={cn(transaction.type === 'income' ? "text-success" : "text-destructive")}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
