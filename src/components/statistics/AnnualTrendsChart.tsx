
import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { statisticsService, StatisticsData } from '@/services/statisticsService';

export function AnnualTrendsChart() {
  const [data, setData] = useState<StatisticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  useEffect(() => {
    // Générer les années disponibles (année courante + 2 années précédentes)
    const currentYear = new Date().getFullYear();
    setAvailableYears([currentYear - 2, currentYear - 1, currentYear]);
  }, []);

  useEffect(() => {
    async function loadAnnualData() {
      setIsLoading(true);
      try {
        const yearlyData = await statisticsService.getYearlyData(selectedYear);
        setData(yearlyData);
      } catch (error) {
        console.error("Erreur lors du chargement des données annuelles", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAnnualData();
  }, [selectedYear]);

  // Calculer le total des revenus et dépenses sur l'année
  const totalIncome = data.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = data.reduce((sum, month) => sum + month.expenses, 0);
  const balance = totalIncome - totalExpenses;
  
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Tendances annuelles</CardTitle>
          <CardDescription>Revenus et dépenses mensuels</CardDescription>
        </div>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(Number(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => {
                      // Utiliser une fonction de formatage simple pour l'axe Y
                      // car il n'accepte que des chaînes de caractères
                      return new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'JPY',
                        maximumFractionDigits: 0
                      }).format(value).replace('JPY', '').trim();
                    }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => (
                      <CurrencyDisplay amount={value} />
                    )} 
                  />
                  <Legend />
                  <Bar name="Revenus" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Dépenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30">
                <p className="text-sm text-muted-foreground mb-1">Total des revenus</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  <CurrencyDisplay amount={totalIncome} />
                </p>
              </div>
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/30">
                <p className="text-sm text-muted-foreground mb-1">Total des dépenses</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  <CurrencyDisplay amount={totalExpenses} />
                </p>
              </div>
              <div className={`p-3 rounded-md ${balance >= 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <CurrencyDisplay 
                    amount={balance} 
                    className={balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}
                  />
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
