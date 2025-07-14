import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { statisticsService } from '@/services/statisticsService';
import { toast } from 'sonner';

interface IncomeSource {
  name: string;
  value: number;
  color: string;
}

export function IncomeSourcesChart() {
  const [data, setData] = useState<IncomeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    const fetchIncomeData = async () => {
      setIsLoading(true);
      try {
        if (date.from && date.to) {
          // Récupérer les sources de revenus directement du service statistique
          const incomeSources = await statisticsService.getIncomeSources(
            date.from.toISOString(),
            date.to.toISOString()
          );
          
          setData(incomeSources);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sources de revenus:', error);
        toast.error('Impossible de récupérer les sources de revenus');
        // Utiliser un tableau vide en cas d'erreur
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIncomeData();
  }, [date]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Sources de revenus</CardTitle>
          <CardDescription>Répartition des revenus pour {date.from && date.to ? `${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}` : "la période sélectionnée"}</CardDescription>
        </div>
        <DatePickerWithRange date={date} setDate={setDate} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Analyse des sources de revenus...</p>
          </div>
        ) : data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    animationDuration={800}
                    animationBegin={0}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip 
                    formatter={(value: number) => (
                      <CurrencyDisplay amount={value} />
                    )} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4 p-4">
              <h3 className="font-medium text-lg">Détails des revenus</h3>
              
              <div className="space-y-6">
                {data.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">
                        <CurrencyDisplay amount={item.value} />
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(item.value / total) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                    <div className="text-xs text-right text-muted-foreground">
                      {((item.value / total) * 100).toFixed(1)}% du total
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total des revenus:</span>
                  <span className="text-lg font-bold">
                    <CurrencyDisplay amount={total} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <p className="text-lg font-medium mb-2">Aucun revenu pour cette période</p>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez de sélectionner une autre plage de dates ou d'ajouter des transactions de type revenu.
            </p>
            <Button className="mt-2" onClick={() => window.location.href = '/add-transaction'}>
              Ajouter un revenu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
