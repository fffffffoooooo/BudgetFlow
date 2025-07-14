
import React from 'react';
import { RecurringPaymentsManager } from '@/components/RecurringPaymentsManager';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BellRing } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function RecurringPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Abonnements & Paiements Récurrents</h1>
        <p className="text-muted-foreground mt-1">
          Gérez vos abonnements et paiements automatiques pour un meilleur contrôle de vos finances
        </p>
      </div>
      
      <Alert>
        <BellRing className="h-4 w-4" />
        <AlertTitle>Automatisation des paiements</AlertTitle>
        <AlertDescription>
          Suivez vos abonnements, automatisez vos paiements récurrents et recevez des rappels avant chaque échéance.
        </AlertDescription>
      </Alert>
      
      <Separator />
      
      <RecurringPaymentsManager />
    </div>
  );
}
