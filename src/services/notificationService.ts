import { toast } from "sonner";
import { api } from "./api";
import { mockApiService } from "./mockApiService";

// Types pour les notifications
export interface NotificationSettings {
  email: boolean;
  app: boolean;
  budgetAlerts: boolean;
  unusualExpenses: boolean;
  monthlyReports: boolean;
  [key: string]: boolean; // Ajout d'un index signature pour compatibilité avec Record<string, boolean>
}

export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

// Service de notifications
export const notificationService = {
  // Sauvegarder les paramètres de notification
  saveSettings: async (settings: NotificationSettings): Promise<boolean> => {
    try {
      // Récupérer l'ID utilisateur actuel
      const userProfile = await api.auth.getProfile();
      const userId = userProfile.user.id || 'current-user';
      
      // Utiliser le service mock pour simuler la sauvegarde
      const result = await mockApiService.saveNotificationSettings(userId, settings as Record<string, boolean>);
      
      if (result.success) {
        return true;
      } else {
        throw new Error("Échec de la sauvegarde des paramètres");
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notification:', error);
      return false;
    }
  },

  // Récupérer les paramètres de notification
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      // Essayer de récupérer l'ID utilisateur
      let userId = 'current-user';
      try {
        const userProfile = await api.auth.getProfile();
        if (userProfile && userProfile.user) {
          userId = userProfile.user.id || 'current-user';
        }
      } catch (error) {
        console.warn('Impossible de récupérer le profil utilisateur, utilisation de l\'ID par défaut');
      }
      
      // Utiliser le service mock pour simuler la récupération
      const settings = await mockApiService.getNotificationSettings(userId);
      return settings as NotificationSettings;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de notification:', error);
      
      // Paramètres par défaut en cas d'erreur
      return {
        email: true,
        app: true,
        budgetAlerts: true,
        unusualExpenses: true,
        monthlyReports: false
      };
    }
  },
  
  // Version synchrone pour la compatibilité avec le code existant
  getSettingsSync: (): NotificationSettings => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres de notification:', error);
    }
    
    // Paramètres par défaut
    return {
      email: true,
      app: true,
      budgetAlerts: true,
      unusualExpenses: true,
      monthlyReports: false
    };
  },

  // Envoyer une notification par email
  sendEmail: async (emailData: EmailNotification): Promise<boolean> => {
    // Générer un ID unique pour le toast
    const toastId = `email-${Date.now()}`;
    
    try {
      // Vérifier si les notifications par email sont activées
      const settings = await notificationService.getSettings();
      if (!settings.email) {
        console.log('Notifications par email désactivées, email non envoyé.');
        return false;
      }

      // Afficher un toast pour indiquer que l'envoi est en cours
      toast.loading(`Envoi d'un email à ${emailData.to}...`, {
        id: toastId,
        duration: 3000 // Assure qu'il disparaît après 3s si pas remplacé
      });
      
      // Utiliser le service mock pour simuler l'envoi d'email
      const result = await mockApiService.sendEmail(emailData);
      
      // Si succès, afficher un toast de confirmation avec le même ID
      if (result.success) {
        toast.success(`Email envoyé à ${emailData.to}`, {
          description: `Sujet: ${emailData.subject}`,
          id: toastId, // Remplace le toast de chargement
          duration: 2000 // Disparaît après 2 secondes
        });
        return true;
      } else {
        throw new Error("L'envoi d'email a échoué");
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      
      // Utiliser le même ID pour remplacer le toast de chargement s'il existe
      toast.error('Échec de l\'envoi de l\'email', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        id: toastId,
        duration: 2000 // Disparaît après 2 secondes
      });
      return false;
    }
  },

  // Envoyer une notification dans l'application
  sendAppNotification: async (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<boolean> => {
    try {
      // Vérifier si les notifications in-app sont activées
      const settings = await notificationService.getSettings();
      if (!settings.app) {
        console.log('Notifications in-app désactivées, notification non envoyée.');
        return false;
      }

      // Afficher la notification via toast
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'error':
          toast.error(message);
          break;
        default:
          toast.info(message);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification in-app:', error);
      return false;
    }
  },

  // Envoyer une alerte de budget
  sendBudgetAlert: async (category: string, spent: number, budget: number): Promise<boolean> => {
    try {
      // Vérifier si les alertes de budget sont activées
      const settings = await notificationService.getSettings();
      if (!settings.budgetAlerts) {
        return false;
      }

      const percentUsed = (spent / budget) * 100;
      const message = `Alerte budget : Vous avez utilisé ${percentUsed.toFixed(0)}% de votre budget "${category}".`;
      
      // Envoyer notification in-app
      notificationService.sendAppNotification(message, 'warning');
      
      // Envoyer email si activé
      if (settings.email) {
        const userProfile = await api.auth.getProfile();
        await notificationService.sendEmail({
          to: userProfile.user.email,
          subject: 'Alerte de budget',
          message,
          template: 'budget-alert',
          data: { category, spent, budget, percentUsed }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte de budget:', error);
      return false;
    }
  },

  // Envoyer une alerte de dépense inhabituelle
  sendUnusualExpenseAlert: async (transaction: any): Promise<boolean> => {
    try {
      // Vérifier si les alertes de dépenses inhabituelles sont activées
      const settings = await notificationService.getSettings();
      if (!settings.unusualExpenses) {
        return false;
      }

      const message = `Dépense inhabituelle détectée : ${transaction.amount} ${transaction.currency} pour "${transaction.description}".`;
      
      // Envoyer notification in-app
      notificationService.sendAppNotification(message, 'warning');
      
      // Envoyer email si activé
      if (settings.email) {
        const userProfile = await api.auth.getProfile();
        await notificationService.sendEmail({
          to: userProfile.user.email,
          subject: 'Dépense inhabituelle détectée',
          message,
          template: 'unusual-expense',
          data: { transaction }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte de dépense inhabituelle:', error);
      return false;
    }
  },

  // Envoyer un rapport mensuel
  sendMonthlyReport: async (month: string, yearData: any): Promise<boolean> => {
    try {
      // Vérifier si les rapports mensuels sont activés
      const settings = await notificationService.getSettings();
      if (!settings.monthlyReports) {
        return false;
      }

      // Envoyer l'email uniquement (les rapports mensuels ne sont pas des notifications in-app)
      if (settings.email) {
        const userProfile = await api.auth.getProfile();
        await notificationService.sendEmail({
          to: userProfile.user.email,
          subject: `Rapport financier mensuel - ${month}`,
          message: `Voici votre rapport financier pour le mois de ${month}.`,
          template: 'monthly-report',
          data: { month, yearData }
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rapport mensuel:', error);
      return false;
    }
  },

  // Tester l'envoi d'email
  testEmailNotification: async (emailOverride?: string): Promise<boolean> => {
    try {
      // Créer un ID unique pour le toast
      const toastId = `email-test-${Date.now()}`;
      
      // Afficher un toast pour indiquer que le test est en cours
      toast.loading("Test d'envoi d'email en cours...", {
        id: toastId,
        duration: 5000 // Limite maximale d'affichage à 5 secondes
      });
      
      // Récupérer le profil utilisateur pour obtenir l'email
      const userProfile = await api.auth.getProfile();
      const userEmail = emailOverride || userProfile?.user?.email || 'utilisateur@example.com';
      
      // Créer un timestamp pour rendre le message unique
      const timestamp = new Date().toLocaleTimeString();
      
      // Vérifier si les notifications par email sont activées
      const settings = await notificationService.getSettings();
      if (!settings.email) {
        toast.error("Les notifications par email sont désactivées", {
          id: toastId,
          description: "Activez-les d'abord dans les paramètres de notification"
        });
        return false;
      }
      
      // Envoyer un email de test avec plus d'informations
      const result = await mockApiService.sendEmail({
        to: userEmail,
        subject: 'Test de notification par email - BABOS',
        message: `Ceci est un test de notification par email envoyé le ${new Date().toLocaleDateString()} à ${timestamp}. Si vous recevez cet email, les notifications par email sont correctement configurées.`,
        template: 'test-email',
        data: {
          username: userProfile?.user?.name || 'Utilisateur',
          timestamp: timestamp,
          settings: settings
        }
      });
      
      if (result.success) {
        toast.success("Email de test envoyé avec succès", {
          id: toastId,
          description: `Un email a été envoyé à ${userEmail}`
        });
        return true;
      } else {
        toast.error("Échec de l'envoi d'email de test", {
          id: toastId
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du test d\'envoi d\'email:', error);
      toast.error('Échec du test d\'envoi d\'email', {
        description: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      return false;
    }
  }
};
