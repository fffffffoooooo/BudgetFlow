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
import { Edit, Plus, Trash2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { toast } from 'sonner';
import CategoryModal from '@/components/CategoryModal';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Catégories et Plafonds</h1>
        <Button onClick={handleAddCategory}>
          <Plus size={16} className="mr-2" /> Nouvelle catégorie
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">
          Chargement des catégories...
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.length > 0 ? (
            categories.map((category) => {
              const percentage = category.limit > 0 ? (category.spent / category.limit) * 100 : 0;
              return (
                <Card key={category._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <CardTitle>{category.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category._id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Plafond mensuel: {category.limit > 0 ? `${category.limit.toFixed(2)} €` : "Non défini"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Dépensé ce mois</span>
                        <span 
                          className={cn(
                            category.limit > 0 && percentage >= 100 ? "text-destructive font-medium" : ""
                          )}
                        >
                          {category.spent.toFixed(2)} € {category.limit > 0 ? `/ ${category.limit.toFixed(2)} €` : ""}
                        </span>
                      </div>
                      {category.limit > 0 && (
                        <Progress 
                          value={percentage > 100 ? 100 : percentage} 
                          className={percentage >= 100 ? "bg-muted" : ""}
                        />
                      )}
                    </div>
                  </CardContent>
                  {category.limit > 0 && (
                    <CardFooter className="text-sm text-muted-foreground">
                      {percentage >= 100 
                        ? <span className="text-destructive">Plafond atteint !</span> 
                        : <span>Reste {(category.limit - category.spent).toFixed(2)} €</span>}
                    </CardFooter>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-10 text-muted-foreground">
              Aucune catégorie trouvée. Créez votre première catégorie en cliquant sur "Nouvelle catégorie".
            </div>
          )}
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
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
