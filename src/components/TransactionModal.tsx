import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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
import { CalendarIcon, Plus, MinusCircle, PlusCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/contexts/CurrencyContext";
import { notificationService } from "@/services/notificationService";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'expense' | 'income';
  transaction?: any; // Pour la modification
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  defaultType = 'expense',
  transaction = null 
}): JSX.Element => {
  const { currency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>(defaultType);
  
  // Définir le type pour les données du formulaire
  interface FormData {
    description: string;
    amount: string;
    type: 'expense' | 'income';
    category: string;
    date: Date;
    currency: string;
    originalAmount: string;
    originalCurrency: string;
  }

  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: '',
    type: defaultType,
    category: '',
    date: new Date(),
    currency: currency,
    originalAmount: '',
    originalCurrency: currency
  });

  // Chargement des catégories disponibles
  // Mettre à jour la devise dans formData lorsqu'elle change dans le contexte
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        currency: currency
      }));
    }
  }, [currency, isOpen]);

  // Charger les catégories et initialiser le formulaire
  useEffect(() => {
    const fetchCategoriesAndSetForm = async () => {
      try {
        const response = await api.categories.getAll();
        const allCategories = response.categories || [];
        setCategories(allCategories);
        
        // Déterminer le type de transaction actuel
        const currentType = transaction ? transaction.type : defaultType;
        setSelectedTab(currentType);

        // Filtrer les catégories pour le type actuel
        const filteredCategories = allCategories.filter(
          cat => currentType === 'income' ? cat.type === 'income' : cat.type !== 'income'
        );
      
      // Si on modifie une transaction existante, pré-remplir les champs
      if (transaction) {
        setFormData({
          description: transaction.description,
          amount: String(Math.abs(transaction.amount)),
          type: transaction.type,
            category: transaction.category?._id || '',
          date: new Date(transaction.date),
          currency: transaction.currency || currency,
          originalAmount: transaction.originalAmount ? String(Math.abs(transaction.originalAmount)) : String(Math.abs(transaction.amount)),
          originalCurrency: transaction.originalCurrency || transaction.currency || currency
        });
      } else {
          // Pour une nouvelle transaction, réinitialiser complètement
        setFormData({
          description: '',
          amount: '',
          type: defaultType,
            category: filteredCategories.length > 0 ? filteredCategories[0]._id : '',
          date: new Date(),
          currency: currency,
          originalAmount: '',
          originalCurrency: currency
        });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        toast.error("Impossible de charger les catégories");
      }
    };
    
    if (isOpen) {
      fetchCategoriesAndSetForm();
    }
  }, [isOpen, defaultType, transaction, currency]); // Ajouter currency comme dépendance
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (value: string) => {
    const newType = value as 'expense' | 'income';
    setSelectedTab(newType);

    // Filtrer les catégories pour le nouveau type
    const filteredCategories = categories.filter(
      cat => newType === 'income' ? cat.type === 'income' : cat.type !== 'income'
    );

    setFormData(prev => ({
      ...prev,
      type: newType,
      // Réinitialiser la catégorie avec la première de la liste filtrée
      category: filteredCategories.length > 0 ? filteredCategories[0]._id : '',
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Préparer les données pour l'API
      const transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
        type: formData.type,
        category: formData.category,
        date: formData.date.toISOString().split('T')[0],
        currency: formData.currency,
        originalAmount: formData.originalAmount ? parseFloat(formData.originalAmount) * (formData.type === 'expense' ? -1 : 1) : undefined,
        originalCurrency: formData.originalCurrency !== formData.currency ? formData.originalCurrency : undefined
      };

      let resultTransaction;
      
      // Appel à l'API pour créer ou mettre à jour la transaction
      if (transaction) {
        // Mise à jour d'une transaction existante
        resultTransaction = await api.transactions.update(transaction._id, transactionData);
        toast.success("Transaction mise à jour avec succès");
        
        // Envoyer une notification pour la mise à jour si les notifications sont activées
        sendTransactionNotification(resultTransaction, 'update');
        
      } else {
        // Création d'une nouvelle transaction
        resultTransaction = await api.transactions.create(transactionData);
        toast.success("Transaction ajoutée avec succès");
        
        // Envoyer une notification pour la nouvelle transaction si les notifications sont activées
        sendTransactionNotification(resultTransaction, 'create');
        
        // Vérifier si c'est une dépense inhabituelle (montant élevé) et envoyer une alerte si nécessaire
        if (resultTransaction.type === 'expense' && Math.abs(resultTransaction.amount) > 500) {
          notificationService.sendUnusualExpenseAlert(resultTransaction);
        }
      }

      // Réinitialiser le formulaire et fermer la modal
      setFormData({
        description: '',
        amount: '',
        type: defaultType,
        category: '',
        date: new Date(),
        currency: currency,
        originalAmount: '',
        originalCurrency: currency
      });
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      toast.error(transaction ? "Erreur lors de la mise à jour" : "Erreur lors de l'ajout");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour envoyer des notifications par email pour les transactions
  const sendTransactionNotification = async (transaction, action) => {
    try {
      // Récupérer le profil utilisateur pour obtenir l'email
      const userProfile = await api.auth.getProfile();
      const userEmail = userProfile?.user?.email || 'utilisateur@example.com';
      
      // Récupérer les détails de la catégorie
      const categoryName = transaction.category?.name || 'Non catégorisé';
      
      // Formatter le montant pour l'affichage
      const formattedAmount = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: transaction.currency || 'EUR'
      }).format(Math.abs(transaction.amount));
      
      // Déterminer le sujet et le message en fonction de l'action
      let subject = '';
      let message = '';
      
      switch (action) {
        case 'create':
          subject = `Nouvelle ${transaction.type === 'income' ? 'entrée' : 'dépense'} enregistrée - BABOS`;
          message = `Une nouvelle ${transaction.type === 'income' ? 'entrée' : 'dépense'} de ${formattedAmount} dans la catégorie ${categoryName} a été enregistrée.`;
          break;
        case 'update':
          subject = `Modification d'une transaction - BABOS`;
          message = `Votre ${transaction.type === 'income' ? 'entrée' : 'dépense'} de ${formattedAmount} dans la catégorie ${categoryName} a été modifiée.`;
          break;
        default:
          subject = `Notification de transaction - BABOS`;
          message = `Une action a été effectuée sur votre transaction de ${formattedAmount}.`;
      }
      
      // Préparer les données de l'email
      const emailData = {
        to: userEmail,
        subject: subject,
        message: message,
        template: "transaction-notification",
        data: {
          username: userProfile?.user?.name || 'Utilisateur',
          transaction: {
            ...transaction,
            formattedAmount,
            formattedDate: new Date(transaction.date).toLocaleDateString('fr-FR'),
            categoryName
          },
          action: action
        }
      };
      
      // Envoyer l'email via le service de notification
      await notificationService.sendEmail(emailData);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de transaction:', error);
      // On ne montre pas d'erreur à l'utilisateur pour ne pas interrompre son flux de travail
      // Les erreurs sont seulement loguées pour le debug
    }
  };
  
  // Effet pour gérer l'initialisation et la fermeture du modal
  useEffect(() => {
    if (!isOpen) {
      // Réinitialiser le formulaire lorsque le modal est fermé
      setFormData({
        description: '',
        amount: '',
        type: defaultType,
        category: '',
        date: new Date(),
        currency: currency,
        originalAmount: '',
        originalCurrency: currency
      });
      setSelectedTab(defaultType);
    }
  }, [isOpen, defaultType, currency]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-card p-6 border-b">
          <DialogTitle className="text-xl font-bold">
            {transaction ? "Modifier la transaction" : "Nouvelle transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction 
              ? "Modifiez les détails de votre transaction" 
              : "Enregistrez une nouvelle transaction"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Tabs 
            value={selectedTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger 
                value="expense" 
                className="flex items-center gap-2 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive transition-all"
                disabled={transaction !== null}
              >
                <MinusCircle className="h-4 w-4" />
                Dépense
              </TabsTrigger>
              <TabsTrigger 
                value="income" 
                className="flex items-center gap-2 data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500 transition-all"
                disabled={transaction !== null}
              >
                <PlusCircle className="h-4 w-4" />
                Revenu
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="expense" className="mt-0 animate-in fade-in-50 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount-expense" className="text-sm font-medium">
                    Montant ({formData.currency})
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount-expense"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => {
                        // Permettre uniquement les chiffres, virgules et points
                        const value = e.target.value.replace(/[^0-9,.]/g, '');
                        handleChange('amount', value);
                      }}
                      onBlur={(e) => {
                        // Formater le montant avec 2 décimales
                        const value = e.target.value.replace(',', '.');
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleChange('amount', numValue.toFixed(2).replace('.', ','));
                        }
                      }}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      {formData.currency}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-expense" className="text-sm font-medium">Catégorie</Label>
                  {categories.length > 0 ? (
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => handleChange('category', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem 
                            key={category._id} 
                            value={category._id} 
                            className="flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color || '#ccc' }} 
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2 px-3 border rounded-md bg-muted/30">
                      Aucune catégorie de dépense disponible. Veuillez d'abord en créer une.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="income" className="mt-0 animate-in fade-in-50 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount-income" className="text-sm font-medium">
                    Montant ({formData.currency})
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount-income"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => {
                        // Permettre uniquement les chiffres, virgules et points
                        const value = e.target.value.replace(/[^0-9,.]/g, '');
                        handleChange('amount', value);
                      }}
                      onBlur={(e) => {
                        // Formater le montant avec 2 décimales
                        const value = e.target.value.replace(',', '.');
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleChange('amount', numValue.toFixed(2).replace('.', ','));
                        }
                      }}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      {formData.currency}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category-income" className="text-sm font-medium">Catégorie</Label>
                  {categories.length > 0 ? (
                    <Select 
                      value={formData.category}
                      onValueChange={(value) => handleChange('category', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem 
                            key={category._id} 
                            value={category._id}
                            className="flex items-center gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color || '#ccc' }} 
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-muted-foreground py-2 px-3 border rounded-md bg-muted/30">
                      Aucune catégorie de revenu disponible. Veuillez d'abord en créer une.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Description de la transaction"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isLoading}
              required
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => handleChange('date', date || new Date())}
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="sm:w-auto w-full"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.category}
              className={cn(
                "sm:w-auto w-full transition-all",
                selectedTab === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
              )}
            >
              {isLoading 
                ? "Chargement..." 
                : transaction 
                  ? "Mettre à jour" 
                  : "Ajouter"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
