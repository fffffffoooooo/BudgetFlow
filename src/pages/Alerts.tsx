import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Bell, CheckCircle, CheckCircle2, Archive, Trash2, Eye, Settings, Sparkles, Brain, Target as TargetIcon, AlertTriangle, Info, Star, Rocket, Plus, BarChart, Wallet, CreditCard, Gift, Clock, Award, TrendingUpIcon, DollarSign, EyeOff, Trash, RefreshCw } from "lucide-react";
import { formatDate } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { api } from '../services/api';
import { toast } from 'sonner';
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
import { Badge } from "@/components/ui/badge";

export interface Alert {
  _id: string;
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  category: {
    _id: string;
    name: string;
    color: string;
  } | null;
  message: string;
  read: boolean;
  resolved: boolean;
  createdAt: string;
  percentage?: number; // Pourcentage d'utilisation du plafond
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'resolved'>('all');
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [markAllReadDialogOpen, setMarkAllReadDialogOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await api.alerts.getAll();
      if (response.alerts) {
        setAlerts(response.alerts);
        console.log('Alertes chargées:', response.alerts);
      } else {
        console.log('Aucune alerte trouvée');
        setAlerts([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des alertes:', error);
      toast.error(error.message || 'Erreur lors du chargement des alertes');
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchir les alertes quand l'onglet change
  useEffect(() => {
    fetchAlerts();
  }, [activeTab]);

  const markAsRead = async (id: string) => {
    try {
      await api.alerts.markAsRead([id]);
      setAlerts(prev => 
        prev.map(alert => 
          alert._id === id ? { ...alert, read: true } : alert
        )
      );
      toast.success('Alerte marquée comme lue');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alerte:', error);
      toast.error('Erreur lors de la mise à jour de l\'alerte');
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await api.alerts.resolve(id);
      setAlerts(prev => 
        prev.map(alert => 
          alert._id === id ? { ...alert, resolved: true } : alert
        )
      );
      toast.success('Alerte marquée comme résolue');
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      toast.error('Erreur lors de la résolution de l\'alerte');
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await api.alerts.delete(id);
      setAlerts(prev => prev.filter(alert => alert._id !== id));
      toast.success('Alerte supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'alerte:', error);
      toast.error('Erreur lors de la suppression de l\'alerte');
    }
  };

  // Marquer toutes les alertes non lues comme lues
  const markAllAsRead = async () => {
    const unreadAlerts = alerts.filter(alert => !alert.read && !alert.resolved);
    if (unreadAlerts.length === 0) return;
    
    try {
      await api.alerts.markAsRead(unreadAlerts.map(alert => alert._id));
      setAlerts(prev => 
        prev.map(alert => 
          !alert.read && !alert.resolved ? { ...alert, read: true } : alert
        )
      );
      toast.success('Toutes les alertes ont été marquées comme lues');
      setMarkAllReadDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des alertes:', error);
      toast.error('Erreur lors de la mise à jour des alertes');
    }
  };

  // Supprimer toutes les alertes
  const deleteAllAlerts = async () => {
    try {
      // Supprimer toutes les alertes une par une
      for (const alert of alerts) {
        await api.alerts.delete(alert._id);
      }
      setAlerts([]);
      toast.success('Toutes les alertes ont été supprimées');
      setDeleteAllDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression des alertes:', error);
      toast.error('Erreur lors de la suppression des alertes');
    }
  };

  // Filtrer les alertes selon l'onglet actif
  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'unread':
        return alerts.filter(alert => !alert.read);
      case 'resolved':
        return alerts.filter(alert => alert.resolved);
      default:
        return alerts;
    }
  };

  const filteredAlerts = getFilteredAlerts();
  const unreadCount = alerts.filter(alert => !alert.read).length;
  const resolvedCount = alerts.filter(alert => alert.resolved).length;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Chargement des alertes...</h3>
              <p className="text-slate-600 dark:text-slate-400">Récupération de vos notifications</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* En-tête principal avec design moderne */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-2xl border-0 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Centre d'Alertes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">Gérez vos notifications et alertes financières</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            {alerts.length} alertes total
          </Badge>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={() => fetchAlerts()}
          >
            <RefreshCw className="h-5 w-5" />
        </Button>
        </div>
      </div>

      {/* Actions en masse */}
      {alerts.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 rounded-t-lg">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions en masse
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setMarkAllReadDialogOpen(true)}
                disabled={unreadCount === 0}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-4 w-4 mr-2" />
                Marquer tout comme lu ({unreadCount})
              </Button>
              <Button 
                variant="outline"
                onClick={() => setDeleteAllDialogOpen(true)}
                className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer toutes les alertes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets avec style moderne */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-xl shadow-lg">
          <TabsTrigger 
            value="all" 
            className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
            onClick={() => setActiveTab('all')}
          >
            Toutes ({alerts.length})
          </TabsTrigger>
          <TabsTrigger 
            value="unread" 
            className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
            onClick={() => setActiveTab('unread')}
          >
            Non lues ({unreadCount})
          </TabsTrigger>
          <TabsTrigger 
            value="resolved" 
            className="rounded-lg transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
            onClick={() => setActiveTab('resolved')}
          >
            Résolues ({resolvedCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Toutes les alertes
                  </CardTitle>
              <CardDescription className="text-red-600 dark:text-red-400">
                Liste complète de vos notifications et alertes
                  </CardDescription>
              </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard 
                    key={alert._id} 
                    alert={alert} 
                    index={index}
                    onMarkAsRead={markAsRead}
                    onResolve={resolveAlert}
                    onDelete={deleteAlert}
                  />
                ))}
                
                {filteredAlerts.length === 0 && (
                  <EmptyState 
                    title="Aucune alerte"
                    description="Vous n'avez pas encore d'alertes dans cette catégorie"
                    icon={Bell}
                    color="red"
                  />
                  )}
                </div>
              </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Alertes non lues
              </CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-400">
                Alertes nécessitant votre attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard 
                    key={alert._id} 
                    alert={alert} 
                    index={index}
                    onMarkAsRead={markAsRead}
                    onResolve={resolveAlert}
                    onDelete={deleteAlert}
                  />
                ))}
                
                {filteredAlerts.length === 0 && (
                  <EmptyState 
                    title="Aucune alerte non lue"
                    description="Toutes vos alertes ont été lues"
                    icon={CheckCircle}
                    color="amber"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="mt-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-t-lg">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Alertes résolues
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                Alertes que vous avez traitées
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {filteredAlerts.map((alert, index) => (
                  <AlertCard 
                    key={alert._id} 
                    alert={alert} 
                    index={index}
                    onMarkAsRead={markAsRead}
                    onResolve={resolveAlert}
                    onDelete={deleteAlert}
                  />
                ))}
                
                {filteredAlerts.length === 0 && (
                  <EmptyState 
                    title="Aucune alerte résolue"
                    description="Vous n'avez pas encore résolu d'alertes"
                    icon={CheckCircle2}
                    color="green"
                  />
                )}
              </div>
            </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogues de confirmation */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Supprimer toutes les alertes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Êtes-vous sûr de vouloir supprimer toutes les alertes ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteAllAlerts}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={markAllReadDialogOpen} onOpenChange={setMarkAllReadDialogOpen}>
        <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Marquer tout comme lu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Marquer toutes les alertes non lues comme lues ? Cette action peut être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={markAllAsRead}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Eye className="h-4 w-4 mr-2" />
              Marquer comme lu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Composant pour une carte d'alerte
interface AlertCardProps {
  alert: Alert;
  index: number;
  onMarkAsRead: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlertCard = ({ alert, index, onMarkAsRead, onResolve, onDelete }: AlertCardProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'budget_limit': return AlertTriangle;
      case 'unusual_expense': return DollarSign;
      case 'monthly_report': return BarChart;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'budget_limit': return 'from-red-500 to-orange-600';
      case 'unusual_expense': return 'from-amber-500 to-yellow-600';
      case 'monthly_report': return 'from-blue-500 to-indigo-600';
      default: return 'from-slate-500 to-gray-600';
    }
  };

  const Icon = getAlertIcon(alert.type);
  const colorClass = getAlertColor(alert.type);

  return (
    <div 
      className="group relative overflow-hidden p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/20 dark:hover:to-orange-950/10 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg animate-in fade-in-50 duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="flex items-start gap-4 relative z-10">
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 bg-gradient-to-br ${colorClass}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {!alert.read && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          {alert.resolved && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {alert.category?.name || 'Alerte'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(alert.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {alert.read ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Bell className="h-4 w-4 text-amber-500" />
              )}
              {alert.resolved && <CheckCircle className="h-4 w-4 text-blue-500" />}
                </div>
                </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{alert.message}</p>
                  {alert.type === 'budget_limit' && alert.category && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${alert.percentage || 0}%` }}
                        />
                      </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {alert.percentage?.toFixed(1)}% utilisé
                      </span>
                    </div>
                  )}
          <div className="flex justify-end gap-2">
            {!alert.read && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onMarkAsRead(alert._id)}
                className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                Marquer comme lu
              </Button>
            )}
            {!alert.resolved && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onResolve(alert._id)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Résoudre
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(alert._id)}
              className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
            >
              <Trash className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour l'état vide
interface EmptyStateProps {
  title: string;
  description: string;
  icon: any;
  color: string;
}

const EmptyState = ({ title, description, icon: Icon, color }: EmptyStateProps) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red': return 'from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-600 dark:text-red-400';
      case 'amber': return 'from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-600 dark:text-amber-400';
      case 'green': return 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400';
      default: return 'from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="text-center py-12">
      <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br ${getColorClasses(color)} flex items-center justify-center`}>
        <Icon className="h-8 w-8" />
            </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
};
