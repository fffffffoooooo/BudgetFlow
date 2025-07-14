
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, X } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface Alert {
  _id: string;
  type: 'budget_limit' | 'unusual_expense' | 'monthly_report';
  message: string;
  createdAt: string;
  read: boolean;
  resolved: boolean;
  category?: {
    name: string;
    color: string;
  };
}

interface AlertsWidgetProps {
  alerts: Alert[];
  onUpdate: () => void;
  maxAlerts?: number;
  compact?: boolean;
}

export function AlertsWidget({ alerts, onUpdate, maxAlerts = 3, compact = false }: AlertsWidgetProps) {
  const displayedAlerts = alerts.slice(0, maxAlerts);
  
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "Date inconnue";
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date invalide";
    }
  };
  
  const markAsRead = async (id: string) => {
    try {
      await api.alerts.update(id, { active: false });
      toast.success("Alerte marquée comme lue");
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'alerte:", error);
    }
  };
  
  const resolveAlert = async (id: string) => {
    try {
      await api.alerts.update(id, { active: false });
      toast.success("Alerte résolue");
      onUpdate();
    } catch (error) {
      console.error("Erreur lors de la résolution de l'alerte:", error);
    }
  };

  return (
    <Card className={cn("border-0 shadow-md", compact ? "h-full" : "")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(compact ? "max-h-[300px] overflow-y-auto" : "")}>
        {displayedAlerts.length > 0 ? (
          <div className="space-y-4">
            {displayedAlerts.map(alert => (
              <div key={alert._id} className="relative border rounded-lg p-4 bg-background">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(alert.createdAt)}</span>
                      {alert.category && (
                        <>
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: alert.category.color }}
                          />
                          <span>{alert.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => markAsRead(alert._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => resolveAlert(alert._id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>Aucune alerte active</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
