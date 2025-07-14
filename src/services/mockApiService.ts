// Service qui simule des réponses API pour les fonctionnalités qui ne sont pas encore implémentées côté backend
import { toast } from "sonner";

// Type pour les notifications email
export interface EmailNotificationRequest {
  to: string;
  subject: string;
  message: string;
  template?: string;
  data?: Record<string, any>;
}

// Simulation de délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Service mock pour simuler des appels API
export const mockApiService = {
  // Simuler l'envoi d'un email
  sendEmail: async (emailData: EmailNotificationRequest): Promise<{ success: boolean, messageId?: string }> => {
    // Simuler un délai réseau (entre 1 et 2 secondes)
    await delay(1000 + Math.random() * 1000);
    
    // Simuler une réussite dans 95% des cas
    const isSuccess = Math.random() > 0.05;
    
    if (!isSuccess) {
      throw new Error("Échec de l'envoi de l'email (simulation d'erreur)");
    }
    
    // Log dans la console pour debug
    console.log(`[MOCK API] Email envoyé à ${emailData.to}`);
    console.log(`[MOCK API] Sujet: ${emailData.subject}`);
    console.log(`[MOCK API] Message: ${emailData.message}`);
    
    if (emailData.template) {
      console.log(`[MOCK API] Template utilisé: ${emailData.template}`);
      console.log(`[MOCK API] Données du template:`, emailData.data);
    }
    
    // Générer un ID de message fictif
    const messageId = `msg_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      success: true,
      messageId
    };
  },
  
  // Simuler l'envoi d'une notification dans l'application
  sendAppNotification: async (userId: string, message: string, type: string): Promise<{ success: boolean, notificationId?: string }> => {
    // Simuler un délai réseau
    await delay(500 + Math.random() * 500);
    
    // Log dans la console pour debug
    console.log(`[MOCK API] Notification envoyée à l'utilisateur ${userId}`);
    console.log(`[MOCK API] Message: ${message}`);
    console.log(`[MOCK API] Type: ${type}`);
    
    // Générer un ID de notification fictif
    const notificationId = `notif_${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      success: true,
      notificationId
    };
  },
  
  // Simuler la récupération des paramètres de notification
  getNotificationSettings: async (userId: string): Promise<Record<string, boolean>> => {
    // Simuler un délai réseau
    await delay(300 + Math.random() * 300);
    
    // Récupérer les paramètres depuis le localStorage
    try {
      const storedSettings = localStorage.getItem('notificationSettings');
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('[MOCK API] Erreur lors de la récupération des paramètres:', error);
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
  
  // Simuler la sauvegarde des paramètres de notification
  saveNotificationSettings: async (userId: string, settings: Record<string, boolean>): Promise<{ success: boolean }> => {
    // Simuler un délai réseau
    await delay(500 + Math.random() * 500);
    
    // Sauvegarder les paramètres dans le localStorage
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      console.log(`[MOCK API] Paramètres de notification sauvegardés pour l'utilisateur ${userId}`, settings);
      return { success: true };
    } catch (error) {
      console.error('[MOCK API] Erreur lors de la sauvegarde des paramètres:', error);
      throw new Error("Échec de la sauvegarde des paramètres (erreur localStorage)");
    }
  }
};
