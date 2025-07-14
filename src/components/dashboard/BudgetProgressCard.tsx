import React from 'react';
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface Budget {
  _id: string;
  amount: number;
  category: Category;
  spent: number;
  limit?: number;
}

interface BudgetProgressCardProps {
  budgets: Budget[];
}

export function BudgetProgressCard({ budgets }: BudgetProgressCardProps) {
  // Si aucun budget n'est défini, afficher un message
  if (budgets.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Aucune catégorie avec des dépenses ce mois-ci.
      </div>
    );
  }
  
  const displayBudgets = [...budgets];

  // Trier les budgets par montant dépensé (du plus élevé au plus bas)
  displayBudgets.sort((a, b) => b.spent - a.spent);
  
  // Limiter à 5 catégories pour éviter de surcharger l'interface
  const topCategories = displayBudgets.slice(0, 5);
  
  return (
    <div className="space-y-4">
      {topCategories.map((budget) => {
        // Calculer le pourcentage par rapport au budget défini ou au montant dépensé si pas de budget
        const hasBudget = budget.amount > 0;
        const percentage = hasBudget 
          ? Math.min(Math.round((budget.spent / budget.amount) * 100), 100) 
          : 100; // Afficher 100% si pas de budget défini
        
        // Déterminer la couleur de la barre de progression
        let progressColor = "bg-primary";
        if (hasBudget) {
          if (percentage > 100) {
            progressColor = "bg-destructive";
          } else if (percentage > 75) {
            progressColor = "bg-amber-500";
          } else if (percentage > 50) {
            progressColor = "bg-amber-400";
          }
        } else {
          // Couleur différente pour les catégories sans budget défini
          progressColor = "bg-gray-300 dark:bg-gray-600";
        }
        
        return (
          <div key={budget._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: budget.category.color }}
                />
                <span className="text-sm font-medium">{budget.category.name}</span>
              </div>
              <span className="text-sm font-medium">
                {percentage}%
              </span>
            </div>
            
            <div className="space-y-1">
              <Progress 
                value={percentage} 
                className={`h-2 ${progressColor}`} 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span><CurrencyDisplay amount={budget.spent} fromCurrency="EUR" /></span>
                <span>{budget.amount > 0 ? <CurrencyDisplay amount={budget.amount} fromCurrency="EUR" /> : 'Non défini'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
