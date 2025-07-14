
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { api } from '@/services/api';

const colors = [
  { name: "Rouge", value: "#ef4444" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Jaune", value: "#eab308" },
  { name: "Vert", value: "#22c55e" },
  { name: "Bleu ciel", value: "#0ea5e9" },
  { name: "Bleu", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
  { name: "Gris", value: "#6b7280" }
];

export default function NewCategory() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0].value);
  const [limit, setLimit] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Veuillez saisir un nom pour la catégorie");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const categoryData = {
        name,
        color,
        limit: limit ? parseFloat(limit) : 0
      };
      
      await api.categories.create(categoryData);
      toast.success("Catégorie créée avec succès");
      navigate('/categories');
    } catch (error) {
      console.error("Erreur lors de la création de la catégorie:", error);
      toast.error("Impossible de créer la catégorie");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nouvelle Catégorie</h1>
      </div>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Créer une nouvelle catégorie</CardTitle>
            <CardDescription>
              Les catégories vous permettent d'organiser vos transactions et de suivre vos dépenses par type
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie</Label>
              <Input 
                id="name" 
                placeholder="Ex: Alimentation, Transport, Loisirs..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une couleur" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((colorOption) => (
                      <SelectItem key={colorOption.value} value={colorOption.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: colorOption.value }}
                          ></div>
                          {colorOption.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className="w-10 h-10 rounded-full border flex items-center justify-center"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="limit">Limite budgétaire mensuelle (optionnelle)</Label>
              <div className="relative">
                <Input 
                  id="limit"
                  type="number"
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Définissez une limite mensuelle pour cette catégorie pour recevoir des alertes
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t px-6 py-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate('/categories')}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer la catégorie"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
