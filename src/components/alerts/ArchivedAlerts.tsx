
import React from 'react';
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertItem } from './AlertItem';

interface Alert {
  _id: string;
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  message: string;
  createdAt: string;
  read: boolean;
  resolved: boolean;
  category?: {
    _id: string;
    name: string;
    color: string;
  };
}

interface ArchivedAlertsProps {
  alerts: Alert[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export const ArchivedAlerts = ({ alerts, isLoading, onDelete }: ArchivedAlertsProps) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Historique des alertes</CardTitle>
        <CardDescription>Alertes résolues ou archivées</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent opacity-70"></div>
            <p className="mt-4 text-muted-foreground">Chargement de l'historique...</p>
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div 
                key={alert._id} 
                className="p-4 border rounded-lg bg-muted/10"
              >
                <AlertItem 
                  alert={alert}
                  onMarkAsRead={() => {}}
                  onResolve={() => {}}
                  onDelete={onDelete}
                  showDeleteButton={true}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
            <p className="text-lg font-medium">Aucune alerte archivée</p>
            <p className="mt-2">Les alertes résolues apparaîtront ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
