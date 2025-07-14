
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { statisticsService, CategorySpending } from '@/services/statisticsService';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

export function CategoryDistributionChart() {
  const [data, setData] = useState<CategorySpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    async function fetchCategoryData() {
      setIsLoading(true);
      
      try {
        // Uniquement récupérer les données si nous avons une plage de dates valide
        if (date.from && date.to) {
          const startDate = date.from.toISOString();
          const endDate = date.to.toISOString();
          const categoryData = await statisticsService.getCategorySpending(startDate, endDate);
          setData(categoryData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données par catégorie", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategoryData();
  }, [date]);

  // Calculer le total des dépenses
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Répartition par catégorie</CardTitle>
        <DatePickerWithRange date={date} setDate={setDate} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  animationDuration={500}
                  animationBegin={0}
                  animationEasing="ease-out"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend layout="vertical" verticalAlign="middle" align="right" />
                <Tooltip 
                  formatter={(value: number) => (
                    <CurrencyDisplay amount={value} />
                  )} 
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="text-center mt-2">
              <p className="text-sm text-muted-foreground">
                Total des dépenses:{' '}
                <span className="font-semibold">
                  <CurrencyDisplay amount={total} />
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <p className="text-lg font-medium">Aucune donnée pour cette période</p>
              <p className="text-sm text-muted-foreground mt-1">
                Essayez de sélectionner une autre plage de dates ou d'ajouter des transactions
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
