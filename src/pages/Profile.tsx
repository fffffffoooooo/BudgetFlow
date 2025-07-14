import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, DollarSign, Calendar, BarChart3, Save, Shield } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  alertEmail: z.string().email("Adresse email invalide").optional().or(z.literal('')),
  netIncomeCeiling: z.union([z.number().min(0, 'Doit être positif').optional(), z.nan()]).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Ajout explicite du champ alertEmail dans le type User pour le support du champ personnalisé côté profil
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  alertEmail?: string;
  netIncomeCeiling?: number | null;
}

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export default function Profile() {
const { user, updateProfile, deleteAccount, isLoading } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [netIncomeData, setNetIncomeData] = useState<any>(null);
  const [isLoadingNetIncome, setIsLoadingNetIncome] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(true);
  const [isUpdatingCeiling, setIsUpdatingCeiling] = useState(false);
  
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      alertEmail: user?.alertEmail || "",
      netIncomeCeiling: user?.netIncomeCeiling ?? undefined,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Charger les données de revenu net
  const loadNetIncomeData = async () => {
    if (!user?.netIncomeCeiling) return;
    
    setIsLoadingNetIncome(true);
    try {
      const response = await api.auth.checkNetIncomeCeiling();
      setNetIncomeData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des données de revenu net:', error);
    } finally {
      setIsLoadingNetIncome(false);
    }
  };

  // Charger les données au montage et quand le plafond change
  useEffect(() => {
    loadNetIncomeData();
  }, [user?.netIncomeCeiling]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        name: data.name,
        email: data.email,
        alertEmail: data.alertEmail,
        netIncomeCeiling: data.netIncomeCeiling !== undefined && !isNaN(data.netIncomeCeiling) ? data.netIncomeCeiling : null,
      });
      
      // Recharger les données de revenu net après mise à jour
      setTimeout(() => {
        loadNetIncomeData();
      }, 1000);
      
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await updateProfile({
        password: data.newPassword,
      });
      passwordForm.reset();
      toast.success("Mot de passe modifié avec succès");
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (error) {
      console.error("Delete account error:", error);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= 80) return 'text-orange-600 dark:text-orange-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= 80) return <TrendingUp className="h-4 w-4" />;
    if (percentage >= 60) return <BarChart3 className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const handleCheckBalance = async () => {
    try {
      setIsCheckingBalance(true);
      const result = await api.auth.checkBalance();
      setBalanceData(result.data);
      
      if (result.alert) {
        toast.success(result.message);
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du solde:', error);
      toast.error("Impossible de vérifier le solde");
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const handleUpdateNetIncomeCeiling = async () => {
    try {
      setIsUpdatingCeiling(true);
      await api.auth.updateProfile({ netIncomeCeiling: user?.netIncomeCeiling });
      toast.success('Plafond de revenu net mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingCeiling(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Mon Profil
        </h1>
        <Badge variant="outline" className="text-sm px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <Target className="h-4 w-4 mr-2" />
          Gestion des paramètres
        </Badge>
      </div>
      
      {/* Section Plafond de Revenu Net */}
      {user?.netIncomeCeiling && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-t-lg">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-5 w-5" />
              Plafond de Revenu Net
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Suivi en temps réel de votre revenu net par rapport au plafond défini
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingNetIncome ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Chargement des données...</span>
              </div>
            ) : netIncomeData ? (
    <div className="space-y-6">
                {/* Plafond défini */}
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Plafond défini
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {user.netIncomeCeiling.toFixed(2)} €
                  </p>
                </div>

                {/* Statistiques mensuelles */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Statistiques mensuelles
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-600">Revenus</span>
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {netIncomeData.monthly.income.toFixed(2)} €
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-600">Dépenses</span>
                      </div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {netIncomeData.monthly.expenses.toFixed(2)} €
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-600">Revenu Net</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {netIncomeData.monthly.netIncome.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  
                  {/* Barre de progression mensuelle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Progression mensuelle</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(netIncomeData.monthly.percentage)}
                        <span className={`text-sm font-bold ${getStatusColor(netIncomeData.monthly.percentage)}`}>
                          {netIncomeData.monthly.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(netIncomeData.monthly.percentage, 100)} 
                      className="h-3"
                    />
                    <p className="text-xs text-slate-500">
                      {netIncomeData.monthly.netIncome.toFixed(2)}€ / {user.netIncomeCeiling}€
                    </p>
                  </div>
                </div>

                {/* Statistiques hebdomadaires */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Statistiques hebdomadaires
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-600">Revenus</span>
                      </div>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {netIncomeData.weekly.income.toFixed(2)} €
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-600">Dépenses</span>
                      </div>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {netIncomeData.weekly.expenses.toFixed(2)} €
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-600">Revenu Net</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {netIncomeData.weekly.netIncome.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  
                  {/* Barre de progression hebdomadaire */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Progression hebdomadaire</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(netIncomeData.weekly.percentage)}
                        <span className={`text-sm font-bold ${getStatusColor(netIncomeData.weekly.percentage)}`}>
                          {netIncomeData.weekly.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(netIncomeData.weekly.percentage, 100)} 
                      className="h-3"
                    />
                    <p className="text-xs text-slate-500">
                      {netIncomeData.weekly.netIncome.toFixed(2)}€ / {netIncomeData.weekly.ceiling.toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-600">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Informations personnelles */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-t-lg">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Informations personnelles
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-400">
            Modifiez vos informations personnelles et paramètres d'alerte
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="alertEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de réception des alertes</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="ex: mon.email@domaine.com" />
                    </FormControl>
                    <FormDescription>
                      Cet e-mail sera utilisé pour recevoir les alertes importantes liées à votre compte.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="netIncomeCeiling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plafond de revenu net (€)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="ex: 2000"
                        value={field.value ?? ''}
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Si défini, vous recevrez une alerte si votre revenu net (revenus - dépenses) dépasse ce plafond sur une période donnée.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isUpdatingCeiling}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {isUpdatingCeiling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Changer le mot de passe */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 rounded-t-lg">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Changer le mot de passe
          </CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-400">
            Pour plus de sécurité, utilisez un mot de passe que vous n'utilisez sur aucun autre site.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormDescription>
                      Utilisez au moins 6 caractères.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Modification...
                  </>
                ) : (
                  "Changer le mot de passe"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Danger Zone */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-red-200 dark:border-red-800">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 rounded-t-lg">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Zone dangereuse
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400">
            Les actions suivantes sont irréversibles. Veuillez procéder avec prudence.
          </CardDescription>
        </CardHeader>
        <CardFooter className="p-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Êtes-vous absolument sûr?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                  Cette action ne peut pas être annulée. Cela supprimera définitivement votre compte
                  et toutes vos données associées de nos serveurs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount} 
                  className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>

      {/* Section Plafond de Revenu Net */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Plafond de Revenu Net
              </CardTitle>
              <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                Définissez un seuil d'alerte pour votre revenu net
              </CardDescription>
            </div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {showInfoMessage && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Comment fonctionne le plafond de revenu net ?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Si votre revenu net (revenus - dépenses) dépasse ce plafond sur la période, une alerte sera générée et un email vous sera envoyé.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfoMessage(false)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="netIncomeCeiling">Plafond mensuel (€)</Label>
              <Input
                id="netIncomeCeiling"
                type="number"
                value={user?.netIncomeCeiling || ''}
                onChange={(e) => updateProfile({ netIncomeCeiling: Number(e.target.value) })}
                placeholder="Ex: 3000"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Plafond hebdomadaire (€)</Label>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                <span className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  {user?.netIncomeCeiling ? (user.netIncomeCeiling / 4).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleUpdateNetIncomeCeiling}
              disabled={isUpdatingCeiling}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {isUpdatingCeiling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder le plafond
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleCheckBalance}
              disabled={isCheckingBalance}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30"
            >
              {isCheckingBalance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Vérifier le solde
                </>
              )}
            </Button>
          </div>

          {/* Affichage des résultats de vérification du solde */}
          {balanceData && (
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Résultats de la vérification
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Solde Total */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Solde Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {balanceData.total.balance.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Plafond: {balanceData.total.ceiling.toFixed(2)}€
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, balanceData.total.percentage))} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500">
                        {balanceData.total.percentage.toFixed(1)}% du plafond
                      </div>
                      {balanceData.total.deficit > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Déficit: {balanceData.total.deficit.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Solde Mensuel */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Solde Mensuel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {balanceData.monthly.balance.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Plafond: {balanceData.monthly.ceiling.toFixed(2)}€
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, balanceData.monthly.percentage))} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500">
                        {balanceData.monthly.percentage.toFixed(1)}% du plafond
                      </div>
                      {balanceData.monthly.deficit > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Déficit: {balanceData.monthly.deficit.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Solde Hebdomadaire */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Solde Hebdomadaire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {balanceData.weekly.balance.toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Plafond: {balanceData.weekly.ceiling.toFixed(2)}€
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, balanceData.weekly.percentage))} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500">
                        {balanceData.weekly.percentage.toFixed(1)}% du plafond
                      </div>
                      {balanceData.weekly.deficit > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Déficit: {balanceData.weekly.deficit.toFixed(2)}€
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
