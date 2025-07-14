import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/utils/formatters';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { 
  Plus, Target, Calendar, TrendingUp, 
  PiggyBank, Home, Car, GraduationCap, 
  Plane, Shield, Star, Loader2 
} from 'lucide-react';

interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  suggestedContribution: number;
  targetDate?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  remainingAmount: number;
  monthsRemaining?: number;
}

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalUpdated: () => void;
  onSave?: (goalData: any) => Promise<void>;
  mode?: 'create' | 'edit';
  initialData?: any;
}

const categoryIcons = {
  emergency: Shield,
  vacation: Plane,
  house: Home,
  car: Car,
  education: GraduationCap,
  retirement: PiggyBank,
  other: Target
};

const priorityColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({ isOpen, onClose, onGoalUpdated, onSave, mode, initialData }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    category: 'other',
    priority: 'medium' as const,
    monthlyContribution: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadGoals();
    }
  }, [isOpen]);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await api.savingsGoals.getStats();
      setGoals(response.goals);
      setStats(response.stats);
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      toast.error('Impossible de charger les objectifs d\'épargne');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!formData.name || !formData.targetAmount) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsCreating(true);
    try {
      await api.savingsGoals.create({
        name: formData.name,
        targetAmount: Number(formData.targetAmount),
        targetDate: formData.targetDate || null,
        category: formData.category,
        priority: formData.priority,
        monthlyContribution: Number(formData.monthlyContribution) || 0
      });

      toast.success('Objectif d\'épargne créé avec succès');
      setShowCreateForm(false);
      setFormData({
        name: '',
        targetAmount: '',
        targetDate: '',
        category: 'other',
        priority: 'medium',
        monthlyContribution: ''
      });
      loadGoals();
      onGoalUpdated();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'objectif');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    try {
      await api.savingsGoals.delete(goalId);
      toast.success('Objectif supprimé avec succès');
      loadGoals();
      onGoalUpdated();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      emergency: 'Urgence',
      vacation: 'Vacances',
      house: 'Maison',
      car: 'Voiture',
      education: 'Éducation',
      retirement: 'Retraite',
      other: 'Autre'
    };
    return labels[category as keyof typeof labels] || 'Autre';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée'
    };
    return labels[priority as keyof typeof labels] || 'Moyenne';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs d'épargne
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistiques globales */}
            {stats && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
                <CardHeader>
                  <CardTitle className="text-lg">Vue d'ensemble</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalGoals}</div>
                      <div className="text-sm text-gray-600">Objectifs actifs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalTarget)}</div>
                      <div className="text-sm text-gray-600">Objectif total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalCurrent)}</div>
                      <div className="text-sm text-gray-600">Épargné</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalProgress.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Progression</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={stats.totalProgress} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bouton créer */}
            {!showCreateForm && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvel objectif d'épargne
              </Button>
            )}

            {/* Formulaire de création */}
            {showCreateForm && (
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg">Nouvel objectif d'épargne</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de l'objectif *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Vacances d'été"
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetAmount">Montant cible (€) *</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Catégorie</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emergency">Urgence</SelectItem>
                          <SelectItem value="vacation">Vacances</SelectItem>
                          <SelectItem value="house">Maison</SelectItem>
                          <SelectItem value="car">Voiture</SelectItem>
                          <SelectItem value="education">Éducation</SelectItem>
                          <SelectItem value="retirement">Retraite</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priorité</Label>
                      <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetDate">Date cible</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthlyContribution">Contribution mensuelle (€)</Label>
                      <Input
                        id="monthlyContribution"
                        type="number"
                        value={formData.monthlyContribution}
                        onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                        placeholder="Ex: 200"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateGoal}
                      disabled={isCreating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        'Créer l\'objectif'
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des objectifs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mes objectifs d'épargne</h3>
              {goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun objectif d'épargne défini</p>
                  <p className="text-sm">Créez votre premier objectif pour commencer à épargner</p>
                </div>
              ) : (
                goals.map((goal) => {
                  const IconComponent = categoryIcons[goal.category as keyof typeof categoryIcons] || Target;
                  return (
                    <Card key={goal._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{goal.name}</h4>
                                <Badge className={priorityColors[goal.priority]}>
                                  {getPriorityLabel(goal.priority)}
                                </Badge>
                                <Badge variant="outline">
                                  {getCategoryLabel(goal.category)}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </div>
                              <Progress value={goal.progress} className="h-2 mb-2" />
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{goal.progress.toFixed(1)}% atteint</span>
                                <span>{formatCurrency(goal.remainingAmount)} restant</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm text-gray-600 mb-1">Contribution suggérée</div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(goal.suggestedContribution)}/mois
                            </div>
                            {goal.monthsRemaining && (
                              <div className="text-xs text-gray-500">
                                {goal.monthsRemaining} mois restants
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleDeleteGoal(goal._id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavingsGoalModal; 