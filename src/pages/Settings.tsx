import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CURRENCIES } from "@/utils/currency";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { Loader2, Save, Sun, Moon, Monitor, Send, Bell, Mail, Plus, X } from 'lucide-react';
import { CurrencyContext } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { notificationService } from '@/services/notificationService';
import { api } from '@/services/api';
import { SmtpConfigForm } from '@/components/SmtpConfigForm';
import { useAuth } from '@/contexts/AuthContext';

type Theme = 'light' | 'dark' | 'system';

interface SettingsType {
  general: {
    language: string;
    currency: string;
    theme: Theme;
  };
  notifications: {
    email: boolean;
    app: boolean;
    budgetAlerts: boolean;
    unusualExpenses: boolean;
    monthlyReports: boolean;
  };
}

// Valeurs par défaut pour les paramètres
const DEFAULT_SETTINGS: SettingsType = {
  general: {
    language: 'fr',
    currency: 'EUR',
    theme: 'system'
  },
  notifications: {
    email: true,
    app: true,
    budgetAlerts: true,
    unusualExpenses: true,
    monthlyReports: false
  }
};

const Settings = () => {
  const { user } = useAuth();
  const [userAlertEmails, setUserAlertEmails] = useState<{ name: string; email: string; alertEmail?: string }[]>([]);
  const [loadingAlertEmails, setLoadingAlertEmails] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      setLoadingAlertEmails(true);
      // TODO: Assure-toi que api.auth.getAllUsers() existe côté backend et renvoie bien alertEmail et role
      api.auth.getAllUsers?.()
        .then((data: any) => {
          setUserAlertEmails(data?.users || []);
        })
        .catch(() => setUserAlertEmails([]))
        .finally(() => setLoadingAlertEmails(false));
    }
  }, [user]);
  // Utiliser le contexte de thème
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Charger les paramètres depuis le localStorage au démarrage
  const loadSettings = (): SettingsType => {
    try {
      // Charger les paramètres généraux
      const savedSettings = localStorage.getItem('appSettings');
      let settings = DEFAULT_SETTINGS;
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // S'assurer que tous les champs requis sont présents
        settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          general: {
            ...DEFAULT_SETTINGS.general,
            ...(parsed.general || {})
          },
          notifications: {
            ...DEFAULT_SETTINGS.notifications,
            ...(parsed.notifications || {})
          }
        };
      }
      
      // Charger les paramètres de notification depuis le service dédié
      // Utiliser la version synchrone pour la compatibilité
      const notificationSettings = notificationService.getSettingsSync();
      
      // Fusionner les paramètres
      return {
        ...settings,
        notifications: {
          ...settings.notifications,
          ...notificationSettings
        }
      };
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
    return DEFAULT_SETTINGS;
  };

  const [settings, setSettings] = useState<SettingsType>(loadSettings());
  const [isSaving, setIsSaving] = useState(false);

  // Récupérer le contexte de devise
  const { setCurrency } = useContext(CurrencyContext);
  
  // Gestion du changement de la devise
  const handleCurrencyChange = (newCurrency: string) => {
    // Mettre à jour l'état local
    const updatedSettings = {
      ...settings,
      general: {
        ...settings.general,
        currency: newCurrency
      }
    };
    setSettings(updatedSettings);
    
    // Mettre à jour la devise dans le contexte
    setCurrency(newCurrency);
    
    // Sauvegarder dans le stockage local
    localStorage.setItem('preferredCurrency', newCurrency);
    
    // Mettre à jour également dans les paramètres de l'application
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    
    // Afficher une notification pour confirmer le changement
    toast.success(`Devise définie sur ${CURRENCIES[newCurrency]?.name || newCurrency}`);
  };

  // Appliquer les paramètres
  const applySettings = (newSettings: SettingsType) => {
    const { general } = newSettings;
    
    // Mettre à jour la langue du document
    document.documentElement.lang = general.language;
    
    // Sauvegarder les paramètres dans le localStorage
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Mettre à jour les préférences utilisateur
    localStorage.setItem('language', general.language);
    localStorage.setItem('currency', general.currency);
    
    // Mettre à jour la devise dans le contexte
    setCurrency(general.currency);
    
    // Si le thème est défini, s'assurer qu'il est appliqué
    if (general.theme) {
      setTheme(general.theme);
    }
  };
  
  // Gérer le changement de thème
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Mettre à jour les paramètres locaux
    const newSettings = {
      ...settings,
      general: {
        ...settings.general,
        theme: newTheme
      }
    };
    setSettings(newSettings);
  };

  // Appliquer les paramètres au chargement
  useEffect(() => {
    applySettings(settings);
  }, []);

  const handleGeneralSettingsChange = (key: string, value: string) => {
    const newSettings = {
      ...settings,
      general: {
        ...settings.general,
        [key]: value
      }
    };
    setSettings(newSettings);
  };

  const handleNotificationSettingChange = (key: string, value: boolean) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    };
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Sauvegarder les paramètres dans le localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Sauvegarder les paramètres de notification via le service
      await notificationService.saveSettings(settings.notifications);
      
      // Appliquer les paramètres
      applySettings(settings);
      
      // Afficher une notification de succès
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      toast.error('Une erreur est survenue lors de la sauvegarde des paramètres');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Tester l'envoi d'emails
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  
  const handleTestEmailNotification = async () => {
    setIsTestingEmail(true);
    try {
      // Assurons-nous que les notifications par email sont activées pour le test
      if (!settings.notifications.email) {
        toast.warning('Veuillez activer les notifications par email d\'abord');
        setIsTestingEmail(false);
        return;
      }
      
      // Utiliser l'email personnalisé si spécifié, sinon utiliser l'email du profil
      const emailToUse = showCustomEmailInput && customEmail ? customEmail : undefined;
      
      // Utiliser la fonction améliorée du service de notification pour envoyer un email de test
      const success = await notificationService.testEmailNotification(emailToUse);
      
      if (!success) {
        throw new Error("L'envoi de l'email de test a échoué");
      }
      
      // Reset du champ email personnalisé après envoi réussi
      if (showCustomEmailInput) {
        setCustomEmail('');
        setShowCustomEmailInput(false);
      }
    } catch (error) {
      console.error('Erreur lors du test d\'envoi d\'email:', error);
      toast.error('Une erreur est survenue lors de l\'envoi de l\'email de test', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsTestingEmail(false);
    }
  };
  
  const toggleCustomEmailInput = () => {
    setShowCustomEmailInput(!showCustomEmailInput);
    if (!showCustomEmailInput) {
      // Focus sur l'input quand il est affiché
      setTimeout(() => {
        const input = document.getElementById('custom-email-input');
        if (input) input.focus();
      }, 100);
    } else {
      setCustomEmail('');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Personnalisez votre expérience et configurez vos préférences
          </p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Onglet Paramètres Généraux */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Personnalisez les paramètres généraux de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select 
                    value={settings.general.language}
                    onValueChange={(value) => handleGeneralSettingsChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Thème</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        theme === 'light' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <Sun className="h-6 w-6 mb-2" />
                      <span className="text-sm">Clair</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        theme === 'dark' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <Moon className="h-6 w-6 mb-2" />
                      <span className="text-sm">Sombre</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('system')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        theme === 'system' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted hover:border-muted-foreground/30'
                      }`}
                    >
                      <Monitor className="h-6 w-6 mb-2" />
                      <span className="text-sm">Système</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {theme === 'system' 
                      ? `Utiliser les paramètres du système (${resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})`
                      : `Thème ${theme === 'dark' ? 'sombre' : 'clair'} sélectionné`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise par défaut</Label>
                  <Select 
                    value={settings.general.currency}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([code, { name, symbol }]) => (
                        <SelectItem key={code} value={code}>
                          {name} ({symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    La devise sélectionnée sera utilisée pour tous les montants affichés.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloc SMTP Config (Admins uniquement) */}
          {user?.role === 'admin' && (
            <>
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Paramètres SMTP</CardTitle>
                  <CardDescription>
                    Configurez le serveur SMTP utilisé pour l'envoi des alertes email (expéditeur centralisé).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SmtpConfigForm />
                </CardContent>
              </Card>

              {/* Tableau lecture seule des alertEmail utilisateurs (optionnel) */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Emails de réception des utilisateurs</CardTitle>
                  <CardDescription>
                    Liste des emails de réception des alertes pour chaque utilisateur (lecture seule).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingAlertEmails ? (
                    <div>Chargement...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left">Nom</th>
                            <th className="px-2 py-1 text-left">Email</th>
                            <th className="px-2 py-1 text-left">E-mail de réception d'alerte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userAlertEmails.map((u) => (
                            <tr key={u.email}>
                              <td className="px-2 py-1">{u.name}</td>
                              <td className="px-2 py-1">{u.email}</td>
                              <td className="px-2 py-1">{u.alertEmail || <span className="italic text-muted-foreground">Non défini</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Paramètres de notification</CardTitle>
                  <CardDescription>
                    Configurez vos préférences de notification
                  </CardDescription>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="email-notifications">Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {showCustomEmailInput && (
                      <div className="flex items-center gap-2 w-full max-w-xs">
                        <Input
                          id="custom-email-input"
                          type="email"
                          placeholder="Adresse email pour le test"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={toggleCustomEmailInput}
                        title="Spécifier une adresse email"
                      >
                        {showCustomEmailInput ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleTestEmailNotification}
                        disabled={isTestingEmail || !settings.notifications.email || (showCustomEmailInput && !customEmail)}
                      >
                        {isTestingEmail ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Tester
                          </>
                        )}
                      </Button>
                      <Switch 
                        id="email-notifications"
                        checked={settings.notifications.email}
                        onCheckedChange={(checked) => handleNotificationSettingChange('email', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="app-notifications">Notifications dans l'application</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications dans l'application
                    </p>
                  </div>
                  <Switch 
                    id="app-notifications"
                    checked={settings.notifications.app}
                    onCheckedChange={(checked) => handleNotificationSettingChange('app', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="budget-alerts">Alertes de budget</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des alertes lorsque vous approchez de la limite de votre budget
                    </p>
                  </div>
                  <Switch 
                    id="budget-alerts"
                    checked={settings.notifications.budgetAlerts}
                    onCheckedChange={(checked) => handleNotificationSettingChange('budgetAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="unusual-expenses">Dépenses inhabituelles</Label>
                    <p className="text-sm text-muted-foreground">
                      Être alerté des dépenses inhabituelles
                    </p>
                  </div>
                  <Switch 
                    id="unusual-expenses"
                    checked={settings.notifications.unusualExpenses}
                    onCheckedChange={(checked) => handleNotificationSettingChange('unusualExpenses', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="monthly-reports">Rapports mensuels</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un rapport mensuel par email
                    </p>
                  </div>
                  <Switch 
                    id="monthly-reports"
                    checked={settings.notifications.monthlyReports}
                    onCheckedChange={(checked) => handleNotificationSettingChange('monthlyReports', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
