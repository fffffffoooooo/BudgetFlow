
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { api } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function WeeklySpendingChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setIsLoading(true);
      try {
        // Récupérer les données hebdomadaires
        const response = await api.statistics.getData({ 
          type: 'weekly',
          category: categoryId !== 'all' ? categoryId : undefined
        });
        
        // Transformation des données pour le graphique
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        const chartData = days.map(day => ({
          name: day,
          value: response.data[day] || 0
        }));
        
        setData(chartData);
      } catch (error) {
        console.error('Erreur lors du chargement des données hebdomadaires:', error);
        
        // Données de démonstration en cas d'erreur
        const chartData = [
          { name: 'Lun', value: 120 },
          { name: 'Mar', value: 80 },
          { name: 'Mer', value: 150 },
          { name: 'Jeu', value: 90 },
          { name: 'Ven', value: 200 },
          { name: 'Sam', value: 250 },
          { name: 'Dim', value: 180 }
        ];
        
        setData(chartData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, [categoryId]);
  
  // Trouver le jour avec les dépenses les plus élevées
  const maxDay = data.reduce((max, item) => (item.value > max.value ? item : max), { name: '', value: 0 });
  
  // Calculer le total des dépenses de la semaine
  const totalSpending = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Dépenses hebdomadaires</CardTitle>
          <CardDescription>Analyse des dépenses par jour de la semaine</CardDescription>
        </div>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Chargement des données hebdomadaires...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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
                    formatter={(value: number) => (
                      <CurrencyDisplay amount={value} />
                    )} 
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8" 
                    name="Dépenses" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-6 flex flex-col justify-center">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Résumé de la semaine</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 border-0 shadow-sm bg-primary/5">
                      <p className="text-sm text-muted-foreground">Total des dépenses</p>
                      <p className="text-xl font-bold mt-1">
                        <CurrencyDisplay amount={totalSpending} />
                      </p>
                    </Card>
                    
                    <Card className="p-4 border-0 shadow-sm bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-sm text-muted-foreground">Moyenne quotidienne</p>
                      <p className="text-xl font-bold mt-1">
                        <CurrencyDisplay amount={totalSpending / 7} />
                      </p>
                    </Card>
                  </div>
                  
                  <Card className="p-4 border-0 shadow-sm">
                    <p className="text-sm text-muted-foreground">Jour avec le plus de dépenses</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xl font-bold">{maxDay.name}</span>
                      <span className="text-xl font-bold">
                        <CurrencyDisplay amount={maxDay.value} />
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
