import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, Plus, Trash2, RefreshCw, 
  TrendingUp, TrendingDown, Target,
  AlertTriangle, CheckCircle, XCircle
} from "lucide-react";
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { toast } from 'sonner';
import CategoryModal from '@/components/CategoryModal';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  _id: string;
  name: string;
  limit: number;
  color: string;
}

interface CategoryWithSpent extends Category {
  spent: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithSpent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithSpent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [resetCategoryDialogOpen, setResetCategoryDialogOpen] = useState(false);
  const [categoryToReset, setCategoryToReset] = useState<string | null>(null);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      // Récupérer toutes les catégories
      const categoriesResponse = await api.categories.getAll();
      const categoriesData = categoriesResponse.categories;

      // Récupérer les transactions pour calculer les dépenses par catégorie
      const transactionsResponse = await api.transactions.getAll();
      const transactions = transactionsResponse.transactions;

      // Calculer les dépenses pour chaque catégorie
      const categoriesWithSpent = categoriesData.map(category => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category._id === category._id)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
          ...category,
          spent
        };
      });

      setCategories(categoriesWithSpent);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
      toast.error("Impossible de charger les catégories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category: CategoryWithSpent) => {
    setSelectedCategory(category);
    setCategoryModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await api.categories.delete(categoryToDelete);
      setCategories(categories.filter(category => category._id !== categoryToDelete));
      toast.success("Catégorie supprimée avec succès");
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de la catégorie:", error);
      
      // Si l'erreur est due à des transactions associées
      if ((error as Error).message.includes('associée à des transactions')) {
        toast.error("Impossible de supprimer cette catégorie car elle est associée à des transactions");
      } else {
        toast.error("Impossible de supprimer la catégorie");
      }
    }
  };

  const openResetCategoryDialog = (id: string) => {
    setCategoryToReset(id);
    setResetCategoryDialogOpen(true);
  };

  const handleResetCategory = async () => {
    if (!categoryToReset) return;
    
    try {
      // Récupérer les transactions de cette catégorie
      const response = await api.transactions.getAll();
      const transactions = response.transactions;
      
      // Filtrer les transactions de dépense pour cette catégorie
      const categoryTransactions = transactions.filter(
        t => t.type === 'expense' && t.category._id === categoryToReset
      );
      
      if (categoryTransactions.length === 0) {
        toast.info("Aucune dépense à réinitialiser pour cette catégorie");
        setResetCategoryDialogOpen(false);
        return;
      }
      
      // Supprimer toutes les transactions de dépense de cette catégorie
      const deletePromises = categoryTransactions.map(transaction => 
        api.transactions.delete(transaction._id)
      );
      
      await Promise.all(deletePromises);
      
      // Mettre à jour l'état local
      setCategories(categories.map(category => {
        if (category._id === categoryToReset) {
          return { ...category, spent: 0 };
        }
        return category;
      }));
      
      toast.success("Dépenses réinitialisées avec succès");
      setResetCategoryDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des dépenses:", error);
      toast.error("Impossible de réinitialiser les dépenses");
    }
  };

  const openResetAllDialog = () => {
    setResetAllDialogOpen(true);
  };

  const handleResetAllCategories = async () => {
    try {
      // Récupérer toutes les transactions
      const response = await api.transactions.getAll();
      const transactions = response.transactions;
      
      // Filtrer toutes les transactions de dépense
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      if (expenseTransactions.length === 0) {
        toast.info("Aucune dépense à réinitialiser");
        setResetAllDialogOpen(false);
        return;
      }
      
      // Supprimer toutes les transactions de dépense
      const deletePromises = expenseTransactions.map(transaction => 
        api.transactions.delete(transaction._id)
      );
      
      await Promise.all(deletePromises);
      
      // Mettre à jour l'état local
      setCategories(categories.map(category => ({ ...category, spent: 0 })));
      
      toast.success("Toutes les dépenses ont été réinitialisées");
      setResetAllDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la réinitialisation de toutes les dépenses:", error);
      toast.error("Impossible de réinitialiser toutes les dépenses");
    }
  };

  const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
  const totalLimit = categories.reduce((sum, category) => sum + category.limit, 0);
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
  const categoriesWithLimit = categories.filter(cat => cat.limit > 0);
  const categoriesOverLimit = categoriesWithLimit.filter(cat => (cat.spent / cat.limit) * 100 >= 100);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header avec statistiques */}
      <div className="space-y-4">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Catégories et Plafonds
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos catégories et surveillez vos dépenses
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={openResetAllDialog}
              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300"
            >
            <RefreshCw size={16} className="mr-2" /> Réinitialiser toutes les dépenses
          </Button>
            <Button 
              onClick={handleAddCategory}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
            <Plus size={16} className="mr-2" /> Nouvelle catégorie
          </Button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Dépensé</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    <CurrencyDisplay amount={totalSpent} fromCurrency="EUR" />
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Plafond Total</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    <CurrencyDisplay amount={totalLimit} fromCurrency="EUR" />
                  </p>
                </div>
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Utilisation</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {overallPercentage.toFixed(1)}%
                  </p>
                </div>
                <div className="h-6 w-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-purple-600 dark:bg-purple-400"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Dépassées</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">
                    {categoriesOverLimit.length}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Liste des catégories */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-muted-foreground">Chargement des catégories...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence>
          {categories.length > 0 ? (
              categories.map((category, index) => {
              const percentage = category.limit > 0 ? (category.spent / category.limit) * 100 : 0;
                const isOverLimit = percentage >= 100;
                const isNearLimit = percentage >= 80 && percentage < 100;
                
              return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={cn(
                      "border-0 shadow-lg transition-all duration-300 hover:shadow-xl",
                      isOverLimit 
                        ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/20 border-red-200 dark:border-red-800" 
                        : isNearLimit
                        ? "bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/20 border-orange-200 dark:border-orange-800"
                        : "bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700"
                    )}>
                      <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                        <div 
                              className="w-5 h-5 rounded-full shadow-md" 
                          style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <CardTitle className="text-lg font-semibold">{category.name}</CardTitle>
                              <CardDescription className="text-sm">
                                Plafond: {category.limit > 0 ? <CurrencyDisplay amount={category.limit} fromCurrency="EUR" /> : "Non défini"}
                              </CardDescription>
                            </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                              size="sm" 
                          onClick={() => openResetCategoryDialog(category._id)}
                              className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                          title="Réinitialiser les dépenses"
                        >
                              <RefreshCw size={14} />
                        </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditCategory(category)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              <Edit size={14} />
                        </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClick(category._id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Dépensé ce mois
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-semibold",
                              isOverLimit ? "text-red-600 dark:text-red-400" : 
                              isNearLimit ? "text-orange-600 dark:text-orange-400" : 
                              "text-gray-700 dark:text-gray-300"
                            )}>
                              <CurrencyDisplay amount={category.spent} fromCurrency="EUR" />
                            </span>
                            {category.limit > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                / <CurrencyDisplay amount={category.limit} fromCurrency="EUR" />
                              </span>
                            )}
                          </div>
                      </div>
                        
                      {category.limit > 0 && (
                          <div className="space-y-2">
                        <Progress 
                          value={percentage > 100 ? 100 : percentage} 
                              className={cn(
                                "h-2",
                                isOverLimit ? "bg-red-100 dark:bg-red-900/30" :
                                isNearLimit ? "bg-orange-100 dark:bg-orange-900/30" :
                                "bg-gray-100 dark:bg-gray-800"
                              )}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {percentage.toFixed(1)}% utilisé
                              </span>
                              {isOverLimit ? (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Plafond dépassé
                                </Badge>
                              ) : isNearLimit ? (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Attention
                                </Badge>
                              ) : (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  <CurrencyDisplay amount={category.limit - category.spent} fromCurrency="EUR" /> restant
                                </span>
                      )}
                    </div>
                          </div>
                        )}
                  </CardContent>
                </Card>
                  </motion.div>
              );
            })
          ) : (
              <motion.div 
                className="col-span-2 text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-gray-400" />
            </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Aucune catégorie trouvée
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Créez votre première catégorie pour commencer à organiser vos dépenses.
                </p>
                <Button onClick={handleAddCategory} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Plus size={16} className="mr-2" />
                  Créer une catégorie
                </Button>
              </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}
      
      {/* Modal d'ajout/modification de catégorie */}
      <CategoryModal 
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={() => fetchCategories()}
        category={selectedCategory}
      />

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette catégorie ? 
              Cette action ne sera pas possible si des transactions sont associées à cette catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boîte de dialogue de confirmation de réinitialisation des dépenses d'une catégorie */}
      <AlertDialog open={resetCategoryDialogOpen} onOpenChange={setResetCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les dépenses</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réinitialiser les dépenses de cette catégorie ?
              Cette action supprimera toutes les transactions de dépense associées à cette catégorie.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetCategory} className="bg-orange-600 hover:bg-orange-700">
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boîte de dialogue de confirmation de réinitialisation de toutes les dépenses */}
      <AlertDialog open={resetAllDialogOpen} onOpenChange={setResetAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser toutes les dépenses</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réinitialiser les dépenses de toutes les catégories ?
              Cette action supprimera toutes les transactions de dépense de votre compte.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAllCategories} className="bg-red-600 hover:bg-red-700">
              Réinitialiser tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
