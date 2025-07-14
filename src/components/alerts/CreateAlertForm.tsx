
import React, { useState } from 'react';
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
import { api } from '@/services/api';
import { toast } from 'sonner';

interface CreateAlertFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateAlertForm({ onSuccess, onCancel }: CreateAlertFormProps) {
  const [formData, setFormData] = useState({
    type: 'budget_limit' as 'budget_limit' | 'unusual_expense' | 'monthly_report',
    categoryId: '',
    threshold: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.alerts.create({
        type: formData.type,
        categoryId: formData.categoryId,
        threshold: parseFloat(formData.threshold)
      });
      
      toast.success('Alerte créée avec succès');
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      toast.error('Erreur lors de la création de l\'alerte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Type d'alerte</Label>
        <Select 
          value={formData.type} 
          onValueChange={(value: 'budget_limit' | 'unusual_expense' | 'monthly_report') => 
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget_limit">Limite de budget</SelectItem>
            <SelectItem value="unusual_expense">Dépense inhabituelle</SelectItem>
            <SelectItem value="monthly_report">Rapport mensuel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="threshold">Seuil</Label>
        <Input
          id="threshold"
          type="number"
          value={formData.threshold}
          onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
          placeholder="Montant en euros"
          required
        />
      </div>

      <div>
        <Label htmlFor="message">Message personnalisé</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Message d'alerte (optionnel)"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Création...' : 'Créer l\'alerte'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
