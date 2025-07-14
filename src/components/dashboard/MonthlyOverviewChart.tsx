
import React from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer
} from 'recharts';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface MonthlyData {
  name: string;
  income: number;
  expenses: number;
}

interface MonthlyOverviewChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function MonthlyOverviewChart({ data, isLoading = false }: MonthlyOverviewChartProps) {
  // Si les données sont vides ou en chargement, afficher un placeholder
  if (isLoading) {
    return (
      <div className="h-64 w-full">
        <div className="h-full w-full flex items-center justify-center">
          <div className="animate-pulse w-full h-full bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </div>
    );
  }
  
  // Données de démo si aucune donnée n'est fournie
  const demoData = [
    { name: 'Jan', income: 2300, expenses: 600 },
    { name: 'Fév', income: 2100, expenses: 700 },
    { name: 'Mar', income: 2400, expenses: 650 },
    { name: 'Avr', income: 2200, expenses: 750 },
    { name: 'Mai', income: 2500, expenses: 800 }
  ];
  
  // Utiliser les données fournies ou les données de démo
  const chartData = data.length > 0 ? data : demoData;

  const config = {
    income: {
      label: "Revenus",
      theme: {
        light: "#10b981", // vert
        dark: "#10b981"
      }
    },
    expenses: {
      label: "Dépenses",
      theme: {
        light: "#ef4444", // rouge
        dark: "#ef4444"
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <ChartContainer config={config} className="h-full w-full">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => {
              // Formater la valeur pour l'axe Y
              return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'JPY',
                maximumFractionDigits: 0
              }).format(value).replace('JPY', '').trim();
            }} 
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <ChartTooltip 
            content={<ChartTooltipContent 
              formatter={(value: number) => <CurrencyDisplay amount={value} />}
              labelFormatter={(label) => `${label}`} 
            />} 
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => `${label}`} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area 
            type="monotone" 
            name="income"
            dataKey="income" 
            stackId="1" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorIncome)" 
          />
          <Area 
            type="monotone" 
            name="expenses"
            dataKey="expenses" 
            stackId="1" 
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorExpenses)" 
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
