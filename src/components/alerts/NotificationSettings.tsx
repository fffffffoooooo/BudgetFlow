
import React from 'react';
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSettings {
  email: boolean;
  app: boolean;
  budgetAlerts: boolean;
  unusualExpenses: boolean;
  monthlyReports: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onSettingsChange: (settings: NotificationSettings) => void;
  onSaveSettings: () => void;
}

export const NotificationSettingsComponent = ({ 
  settings, 
  onSettingsChange, 
  onSaveSettings 
}: NotificationSettingsProps) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Paramètres de notification</CardTitle>
        <CardDescription>Configurez comment et quand vous souhaitez être notifié</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Canaux de notification</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Notifications par email</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recevoir les alertes par email
                  </p>
                </div>
                <Switch 
                  checked={settings.email} 
                  onCheckedChange={(checked) => onSettingsChange({...settings, email: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Notifications dans l'application</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voir les alertes dans l'application
                  </p>
                </div>
                <Switch 
                  checked={settings.app} 
                  onCheckedChange={(checked) => onSettingsChange({...settings, app: checked})}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Types d'alertes</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Alertes de budget</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Être notifié quand un budget approche de sa limite
                  </p>
                </div>
                <Switch 
                  checked={settings.budgetAlerts} 
                  onCheckedChange={(checked) => onSettingsChange({...settings, budgetAlerts: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Dépenses inhabituelles</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Être notifié pour des dépenses anormalement élevées
                  </p>
                </div>
                <Switch 
                  checked={settings.unusualExpenses} 
                  onCheckedChange={(checked) => onSettingsChange({...settings, unusualExpenses: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Rapports mensuels</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recevoir un résumé mensuel de vos finances
                  </p>
                </div>
                <Switch 
                  checked={settings.monthlyReports} 
                  onCheckedChange={(checked) => onSettingsChange({...settings, monthlyReports: checked})}
                />
              </div>
            </div>
          </div>
          
          <Button onClick={onSaveSettings} className="w-full h-10 mt-6">
            <Settings className="h-4 w-4 mr-2" /> Enregistrer les paramètres
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
