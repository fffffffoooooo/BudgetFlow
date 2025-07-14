
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyOverviewChart } from './MonthlyOverviewChart';
import { MonthlyTrendsChart } from './MonthlyTrendsChart';

interface DashboardTabsProps {
  monthlyData: any[];
  isLoading: boolean;
}

export function DashboardTabs({ monthlyData, isLoading }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
        <TabsTrigger value="trends">Tendances mensuelles</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="rounded-lg border border-border bg-white shadow-sm dark:bg-slate-950">
          <div className="p-6">
            <MonthlyOverviewChart data={monthlyData} isLoading={isLoading} />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="trends">
        <MonthlyTrendsChart data={monthlyData} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
}
