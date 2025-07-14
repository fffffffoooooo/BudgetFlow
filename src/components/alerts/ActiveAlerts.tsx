
import React from 'react';
import { Bell } from "lucide-react";
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

interface ActiveAlertsProps {
  alerts: Alert[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ActiveAlerts = ({ 
  alerts, 
  isLoading, 
  onMarkAsRead, 
  onResolve, 
  onDelete 
}: ActiveAlertsProps) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Alertes actives</CardTitle>
        <CardDescription>Alertes et notifications nécessitant votre attention</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent opacity-70"></div>
            <p className="mt-4 text-muted-foreground">Chargement des alertes...</p>
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map(alert => (
              <AlertItem 
                key={alert._id}
                alert={alert}
                onMarkAsRead={onMarkAsRead}
                onResolve={onResolve}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
            <p className="text-lg font-medium">Aucune alerte active</p>
            <p className="mt-2">Vous n'avez pas d'alertes nécessitant votre attention</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
