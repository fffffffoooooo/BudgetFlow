
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
}

export function BalanceCard({ 
  totalIncome, 
  totalExpense 
}: BalanceCardProps) {
  const { currency } = useCurrency();
  const balance = totalIncome - totalExpense;
  const isPositive = balance >= 0;
  
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-muted-foreground">Solde total</h3>
        <div className="mt-2">
          <p className={`text-3xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            <CurrencyDisplay 
              amount={balance} 
              originalCurrency={currency}
              className={isPositive ? 'text-success' : 'text-destructive'}
            />
          </p>
        </div>
        
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
                <ArrowUpCircle className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-medium">Revenus</span>
            </div>
            <span className="font-medium text-success">
              <CurrencyDisplay 
                amount={totalIncome} 
                originalCurrency={currency}
                className="text-success"
              />
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <ArrowDownCircle className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-sm font-medium">Dépenses</span>
            </div>
            <span className="font-medium text-destructive">
              <CurrencyDisplay 
                amount={totalExpense} 
                originalCurrency={currency}
                className="text-destructive"
              />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
