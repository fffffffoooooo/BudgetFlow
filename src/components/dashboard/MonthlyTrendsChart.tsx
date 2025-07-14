
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyData {
  name: string;
  income: number;
  expenses: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function MonthlyTrendsChart({ data, isLoading = false }: MonthlyTrendsChartProps) {
  // Afficher un placeholder pendant le chargement
  if (isLoading) {
    return (
      <div className="h-80 w-full">
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
    );
  }
  
  // Données de démo si aucune donnée n'est fournie
  const demoData = [
    { name: 'Jan', income: 2000, expenses: 500 },
    { name: 'Fév', income: 2200, expenses: 700 },
    { name: 'Mar', income: 2000, expenses: 600 },
    { name: 'Avr', income: 2300, expenses: 900 },
    { name: 'Mai', income: 2400, expenses: 1050 }
  ];
  
  // Utiliser les données fournies ou les données de démo
  const chartData = data.length > 0 ? data : demoData;

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Tendances mensuelles</CardTitle>
        <p className="text-sm text-muted-foreground">Comparaison des dépenses et revenus par mois</p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => {
                  // Formater la valeur pour l'axe Y
                  return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'JPY',
                    maximumFractionDigits: 0
                  }).format(value).replace('JPY', '').trim();
                }} 
              />
              <Tooltip 
                formatter={(value: number) => <CurrencyDisplay amount={value} />}
                labelFormatter={(label) => `${label}`}
              />
              <Legend />
              <Bar name="Revenus" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar name="Dépenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
