
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface AlertBadgeProps {
  type: string;
}

export const AlertBadge = ({ type }: AlertBadgeProps) => {
  switch (type) {
    case 'budget_limit':
      return <Badge variant="destructive">Budget</Badge>;
    case 'unusual_expense':
      return <Badge variant="warning">Dépense inhabituelle</Badge>;
    case 'monthly_report':
      return <Badge variant="outline">Rapport</Badge>;
    default:
      return <Badge>Info</Badge>;
  }
};
