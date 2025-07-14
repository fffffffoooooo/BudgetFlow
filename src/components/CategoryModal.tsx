
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
import { toast } from 'sonner';
import { api } from '@/services/api';
import { notificationService } from '@/services/notificationService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: any; // Pour la modification
}

const CategoryModal: React.FC<CategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  category = null 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366F1', // Indigo par défaut
    limit: ''
  });
  
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Mode édition
        setFormData({
          name: category.name,
          color: category.color,
          limit: category.limit ? String(category.limit) : ''
        });
      } else {
        // Mode création
        setFormData({
          name: '',
          color: '#6366F1',
          limit: ''
        });
      }
    }
  }, [isOpen, category]);
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Le nom de la catégorie est requis");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const categoryData = {
        name: formData.name,
        color: formData.color,
        limit: formData.limit ? parseFloat(formData.limit) : 0
      };
      
      console.log('Soumission des données de catégorie:', categoryData);
      
      let resultCategory;
      
      if (category) {
        // Mise à jour d'une catégorie existante
        resultCategory = await api.categories.update(category._id, categoryData);
        toast.success("Catégorie mise à jour avec succès");
        
        // Envoyer une notification par email pour la mise à jour
        await sendCategoryNotification({
          ...category,
          ...categoryData
        }, 'update');
      } else {
        // Création d'une nouvelle catégorie
        resultCategory = await api.categories.create(categoryData);
        toast.success("Catégorie ajoutée avec succès");
        
        // Envoyer une notification par email pour la création
        await sendCategoryNotification({
          ...resultCategory,
          ...categoryData
        }, 'create');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour envoyer des notifications par email pour une catégorie
  const sendCategoryNotification = async (categoryData, action) => {
    try {
      // Récupérer le profil utilisateur pour obtenir l'email
      const userProfile = await api.auth.getProfile();
      const userEmail = userProfile?.user?.email || 'utilisateur@example.com';
      
      // Déterminer le sujet et le message en fonction de l'action
      let subject = '';
      let message = '';
      
      switch (action) {
        case 'create':
          subject = `Nouvelle catégorie créée - BABOS`;
          message = `Une nouvelle catégorie "${categoryData.name}" a été créée.`;
          break;
        case 'update':
          subject = `Modification d'une catégorie - BABOS`;
          message = `La catégorie "${categoryData.name}" a été modifiée.`;
          break;
        default:
          subject = `Notification de catégorie - BABOS`;
          message = `Une action a été effectuée sur la catégorie "${categoryData.name}".`;
      }
      
      // Ajouter des détails supplémentaires au message
      if (categoryData.limit > 0) {
        message += ` Le plafond budgétaire mensuel est fixé à ${categoryData.limit} €.`;
      }
      
      // Préparer les données de l'email
      const emailData = {
        to: userEmail,
        subject: subject,
        message: message,
        template: "category-notification",
        data: {
          username: userProfile?.user?.name || 'Utilisateur',
          category: categoryData,
          action: action
        }
      };
      
      // Envoyer l'email via le service de notification
      await notificationService.sendEmail(emailData);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de catégorie:', error);
      // On ne montre pas d'erreur à l'utilisateur pour ne pas interrompre son flux de travail
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? "Modifier la catégorie" : "Nouvelle catégorie"}
          </DialogTitle>
          <DialogDescription>
            {category 
              ? "Modifiez les détails de la catégorie" 
              : "Créez une nouvelle catégorie pour organiser vos transactions"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                id="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-12 h-12 p-1"
                disabled={isLoading}
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="flex-grow"
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="limit">Plafond budgétaire mensuel (€)</Label>
            <Input
              id="limit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00 (pas de plafond)"
              value={formData.limit}
              onChange={(e) => handleChange('limit', e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Définissez un plafond de dépenses mensuel pour cette catégorie (0 ou vide = pas de plafond)
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? "Chargement..." 
                : category 
                  ? "Mettre à jour" 
                  : "Créer"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
