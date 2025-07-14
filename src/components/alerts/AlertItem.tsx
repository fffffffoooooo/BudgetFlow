
import React from 'react';
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertBadge } from './AlertBadge';

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

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
  showDeleteButton?: boolean;
}

export const AlertItem = ({ 
  alert, 
  onMarkAsRead, 
  onResolve, 
  onDelete,
  showDeleteButton = true
}: AlertItemProps) => {
  return (
    <div 
      className={`p-4 border rounded-lg ${alert.read ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/10 transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertBadge type={alert.type} />
          {!alert.read && (
            <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(alert.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mb-2">{alert.message}</p>
      {alert.category && (
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: alert.category.color }}
          ></div>
          <span className="text-sm">{alert.category.name}</span>
        </div>
      )}
      <div className="flex justify-end gap-2 mt-3">
        {!alert.read && (
          <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(alert._id)}>
            <Check className="h-4 w-4 mr-1" /> Marquer comme lue
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onResolve(alert._id)}>
          <X className="h-4 w-4 mr-1" /> Résoudre
        </Button>
        {showDeleteButton && (
          <Button variant="ghost" size="sm" onClick={() => onDelete(alert._id)} className="text-destructive hover:text-destructive">
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
};
