import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  TestTube,
  Settings,
  Bell
} from "lucide-react";
import { api } from '@/services/api';
import { toast } from 'sonner';

interface AlertEmailTesterProps {
  alerts: any[];
  onRefresh: () => void;
}

const AlertEmailTester: React.FC<AlertEmailTesterProps> = ({ alerts, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLimits, setIsCheckingLimits] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleTestEmail = async (alertId: string) => {
    setIsLoading(true);
    try {
      const result = await api.alerts.testEmail(alertId);
      toast.success('Email de test envoyé avec succès !');
      setTestResults(result);
      console.log('Résultat du test email:', result);
    } catch (error) {
      console.error('Erreur lors du test email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email de test');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckBudgetLimits = async () => {
    setIsCheckingLimits(true);
    try {
      const result = await api.alerts.checkBudgetLimits();
      toast.success(`${result.alerts.length} alertes générées et emails envoyés !`);
      setTestResults(result);
      onRefresh(); // Rafraîchir la liste des alertes
      console.log('Résultat de la vérification des plafonds:', result);
    } catch (error) {
      console.error('Erreur lors de la vérification des plafonds:', error);
      toast.error('Erreur lors de la vérification des plafonds');
    } finally {
      setIsCheckingLimits(false);
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'budget_limit':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'unusual_expense':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'budget_limit':
        return 'Plafond dépassé';
      case 'unusual_expense':
        return 'Activité inhabituelle';
      default:
        return type;
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-primary" />
          Test des emails d'alertes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bouton de vérification des plafonds */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <h4 className="font-medium text-blue-900">Vérification automatique des plafonds</h4>
            <p className="text-sm text-blue-700">
              Déclenche la vérification des plafonds et l'envoi d'emails
            </p>
          </div>
          <Button 
            onClick={handleCheckBudgetLimits}
            disabled={isCheckingLimits}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCheckingLimits ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isCheckingLimits ? 'Vérification...' : 'Vérifier les plafonds'}
          </Button>
        </div>

        {/* Résultats des tests */}
        {testResults && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">Résultats des tests</h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>✅ {testResults.message}</p>
              {testResults.details && (
                <div className="mt-2 space-y-1">
                  <p>• Alertes d'avertissement: {testResults.details.budgetWarnings}</p>
                  <p>• Alertes de dépassement: {testResults.details.budgetExceeded}</p>
                  <p>• Emails envoyés: {testResults.details.emailsSent}</p>
                </div>
              )}
              {testResults.recipient && (
                <p className="mt-2">
                  📧 Email envoyé à: <strong>{testResults.recipient}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Liste des alertes pour test */}
        {alerts.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Tester l'envoi d'email pour une alerte spécifique</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div 
                  key={alert._id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getAlertTypeIcon(alert.type)}
                    <div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getAlertTypeLabel(alert.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestEmail(alert._id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            {alerts.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Affichage des 5 premières alertes sur {alerts.length}
              </p>
            )}
          </div>
        )}

        {/* Informations */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">Configuration requise</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Configuration SMTP valide dans les paramètres</li>
                <li>• Notifications email activées dans les préférences utilisateur</li>
                <li>• Catégories avec plafonds définis pour les alertes de budget</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertEmailTester; 