
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import Alerts, { Alert } from './Alerts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api } from '@/services/api';
import { toast } from 'sonner';

interface Category {
  _id: string;
  name: string;
  limit: number;
  color: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: string;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

type TransactionType = 'expense' | 'income';

export default function AddTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialType = location.state?.type || 'expense';
  
  const { currency } = useCurrency();
  
  const [transactionData, setTransactionData] = useState({
    amount: '',
    type: initialType as TransactionType,
    description: '',
    category: '',
    date: new Date(),
    currency: currency, // Ajout de la devise par défaut
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.categories.getAll();
        console.log('Catégories chargées:', response.categories);
        setCategories(response.categories);
        
        // Définir la première catégorie comme valeur par défaut
        if (response.categories.length > 0) {
          setTransactionData(prev => ({
            ...prev,
            category: response.categories[0]._id
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
        toast.error("Impossible de charger les catégories");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  const checkCategoryLimit = async (categoryId: string, amount: number) => {
    try {
      // Récupérer les détails de la catégorie
      const response = await api.categories.getById(categoryId);
      const category = (response as { category: Category }).category;
      
      // Vérifier si la catégorie a un plafond défini
      if (!category?.limit || category.limit <= 0) {
        console.log('La catégorie n\'a pas de plafond défini');
        return;
      }
      
      // Récupérer le total des dépenses pour cette catégorie pour le mois en cours
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const transactionsResponse = await api.transactions.getAll({
        search: '',
        startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
        endDate: format(lastDayOfMonth, 'yyyy-MM-dd'),
        categoryId: categoryId
      });
      
      const transactions = (transactionsResponse as { transactions: Transaction[] }).transactions || [];
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const newTotal = totalSpent + amount;
      const percentageUsed = (newTotal / category.limit) * 100;
      
      console.log('Plafond:', category.limit);
      console.log('Total dépensé:', totalSpent);
      console.log('Nouveau total:', newTotal);
      console.log('Pourcentage utilisé:', percentageUsed);
      
      // Créer une alerte si on dépasse 70% du plafond
      if (percentageUsed >= 70) {
        try {
          const alertData = {
            type: 'budget_limit',
            message: `La catégorie ${category.name} a atteint ${percentageUsed.toFixed(1)}% de son plafond (${newTotal.toFixed(2)}€ / ${category.limit.toFixed(2)}€)`,
            category: {
              _id: category._id,
              name: category.name,
              color: category.color
            },
            read: false,
            resolved: false,
            createdAt: new Date().toISOString()
          };
          
          try {
            await api.alerts.create(alertData);
            console.log('Alerte créée avec succès');
          } catch (error) {
            console.error('Erreur lors de la création de l\'alerte:', error);
            toast.error('Erreur lors de la création de l\'alerte');
          }
          
          toast.info(`La catégorie ${category.name} a atteint ${percentageUsed.toFixed(1)}% de son plafond (${newTotal.toFixed(2)}€ / ${category.limit.toFixed(2)}€)`, {
            duration: 10000,
            action: {
              label: 'Voir les alertes',
              onClick: () => navigate('/alerts')
            }
          });
        } catch (alertError) {
          console.error("Erreur lors de la création de l'alerte:", alertError);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du plafond de la catégorie:", error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.amount || !transactionData.description || !transactionData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    try {
      setIsSaving(true);
      const amount = parseFloat(transactionData.amount);
      
      // Créer la transaction avec la devise actuelle
      const response = await api.transactions.create({
        amount: amount,
        type: transactionData.type,
        category: transactionData.category,
        description: transactionData.description,
        date: transactionData.date.toISOString(),
        currency: currency // Utiliser la devise actuelle du contexte
      });
      
      // Mettre à jour le stockage local avec la dernière devise utilisée
      localStorage.setItem('lastUsedCurrency', currency);
      
      // Vérifier le plafond de la catégorie pour les dépenses
      if (transactionData.type === 'expense') {
        await checkCategoryLimit(transactionData.category, amount);
      }
      
      toast.success("Transaction ajoutée avec succès");
      navigate('/transactions');
    } catch (error) {
      console.error("Erreur lors de l'ajout de la transaction:", error);
      toast.error("Impossible d'ajouter la transaction");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/transactions');
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une transaction</CardTitle>
          <CardDescription>
            {transactionData.type === 'expense' 
              ? "Enregistrer une nouvelle dépense" 
              : "Enregistrer un nouveau revenu"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de transaction</Label>
                <Select 
                  value={transactionData.type}
                  onValueChange={(value: string) => setTransactionData({...transactionData, type: value as TransactionType})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Dépense</SelectItem>
                    <SelectItem value="income">Revenu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionData.amount}
                  onChange={(e) => setTransactionData({...transactionData, amount: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Chargement des catégories...</div>
              ) : categories.length > 0 ? (
                <Select 
                  value={transactionData.category}
                  onValueChange={(value) => setTransactionData({...transactionData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Aucune catégorie disponible. Veuillez d'abord créer une catégorie.
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la transaction"
                value={transactionData.description}
                onChange={(e) => setTransactionData({...transactionData, description: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionData.date ? format(transactionData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={transactionData.date}
                    onSelect={(date) => setTransactionData({...transactionData, date: date || new Date()})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "Enregistrement..." : "Ajouter la transaction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
