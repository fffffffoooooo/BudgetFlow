import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnualTrendsChart } from '@/components/statistics/AnnualTrendsChart';
import { CategoryDistributionChart } from '@/components/statistics/CategoryDistributionChart';
import { MonthlyDetailsChart } from '@/components/statistics/MonthlyDetailsChart';
import { IncomeSourcesChart } from '@/components/statistics/IncomeSourcesChart';
import { WeeklySpendingChart } from '@/components/statistics/WeeklySpendingChart';
import { StatsSummaryCards } from '@/components/statistics/StatsSummaryCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, FileText, FileSpreadsheet, 
  TrendingUp, Calendar, X, Check, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { statisticsService } from '@/services/statisticsService';
import { exportService } from '@/services/exportService';
import { DateRange } from 'react-day-picker';
import DateRangeSelector from '@/components/DateRangeSelector';

export default function Statistics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'pdf' | 'csv' | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [exportMode, setExportMode] = useState<'all' | 'range'>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Fonction pour télécharger les rapports
  const downloadReport = async (format: 'csv' | 'pdf') => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Appel au service d'exportation
      const blob = format === 'csv' 
        ? await statisticsService.exportToCSV({
            startDate: firstDayOfMonth.toISOString(),
            endDate: today.toISOString()
          })
        : await statisticsService.exportToPDF({
            startDate: firstDayOfMonth.toISOString(),
            endDate: today.toISOString()
          });
      
      // Créer un URL pour le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-financier-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Rapport au format ${format.toUpperCase()} téléchargé avec succès`);
    } catch (error) {
      console.error(`Erreur lors du téléchargement du rapport ${format}:`, error);
      toast.error(`Échec du téléchargement du rapport ${format.toUpperCase()}`);
    }
  };

  // Fonction d'export avancée
  const handleAdvancedExport = async (type: 'pdf' | 'csv', dateRange?: DateRange) => {
    try {
      setIsExporting(true);
      
      // Récupérer le profil utilisateur
      const userProfile = await api.auth.getProfile();
      
      // Récupérer les statistiques
      const [summary, categorySpending] = await Promise.all([
        statisticsService.getSummary(),
        statisticsService.getCategorySpending(
          dateRange?.from?.toISOString(),
          dateRange?.to?.toISOString()
        )
      ]);
      
      const statistics = {
        totalIncome: summary.totalIncome,
        totalExpenses: summary.totalExpense,
        netIncome: summary.balance,
        transactionCount: 0,
        categoryStats: categorySpending.map(cat => ({
          category: cat.name,
          amount: cat.total,
          count: 0
        })),
        monthlyStats: []
      };
      
      await exportService.exportStatistics(statistics, type, userProfile, dateRange);
      toast.success(`Statistiques ${type.toUpperCase()} générées avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export des statistiques:', error);
      toast.error('Erreur lors de la génération du fichier de statistiques');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = (type: 'pdf' | 'csv') => {
    setSelectedType(type);
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    if (selectedType) {
      handleAdvancedExport(selectedType, exportMode === 'range' ? dateRange : undefined);
      setShowExportModal(false);
      setSelectedType(null);
      setDateRange(undefined);
      setExportMode('all');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Statistiques financières" 
        subtitle="Visualisez et analysez l'évolution de vos finances"
        action={
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="sm" 
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/30 transition-all duration-300 group"
                onClick={() => handleExportClick('csv')}
                disabled={isExporting}
            >
                <FileSpreadsheet className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              CSV
            </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              size="sm" 
                className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/20 border-red-200 dark:border-red-800 hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/40 dark:hover:to-pink-900/30 transition-all duration-300 group"
                onClick={() => handleExportClick('pdf')}
                disabled={isExporting}
            >
                <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              PDF
            </Button>
            </motion.div>
          </div>
        }
      />

      <StatsSummaryCards />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="income">Revenus</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="animate-in fade-in-50 space-y-6">
            <AnnualTrendsChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryDistributionChart />
              <MonthlyDetailsChart />
            </div>
          </TabsContent>

          <TabsContent value="income" className="animate-in fade-in-50 space-y-6">
            <IncomeSourcesChart />
          </TabsContent>

          <TabsContent value="expenses" className="animate-in fade-in-50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategoryDistributionChart />
              <MonthlyDetailsChart />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="animate-in fade-in-50 space-y-6">
            <CategoryDistributionChart />
          </TabsContent>

          <TabsContent value="weekly" className="animate-in fade-in-50 space-y-6">
            <WeeklySpendingChart />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modal d'export avancé */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Exporter les statistiques
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExportModal(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Type d'export */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Format d'export
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={selectedType === 'pdf' ? 'default' : 'outline'}
                        className={cn(
                          "w-full h-12 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                          selectedType === 'pdf' 
                            ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setSelectedType('pdf')}
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-xs">PDF</span>
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={selectedType === 'csv' ? 'default' : 'outline'}
                        className={cn(
                          "w-full h-12 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                          selectedType === 'csv' 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setSelectedType('csv')}
                      >
                        <FileSpreadsheet className="h-5 w-5" />
                        <span className="text-xs">CSV</span>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Mode d'export */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Période d'export
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={exportMode === 'all' ? 'default' : 'outline'}
                        className={cn(
                          "w-full h-12 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                          exportMode === 'all' 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setExportMode('all')}
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs">Toutes</span>
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={exportMode === 'range' ? 'default' : 'outline'}
                        className={cn(
                          "w-full h-12 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                          exportMode === 'range' 
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg" 
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                        onClick={() => setExportMode('range')}
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Intervalle</span>
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Sélecteur de date */}
                {exportMode === 'range' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sélectionner la période
                    </label>
                    <DateRangeSelector
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      className="w-full"
                    />
                  </motion.div>
                )}

                {/* Résumé */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Statistiques à exporter:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {exportMode === 'range' && dateRange?.from ? 'Période sélectionnée' : 'Toutes les données'}
                    </Badge>
                  </div>
                  {exportMode === 'range' && dateRange?.from && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Du {dateRange.from.toLocaleDateString('fr-FR')} 
                      {dateRange.to && ` au ${dateRange.to.toLocaleDateString('fr-FR')}`}
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 h-10"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleConfirmExport}
                    disabled={!selectedType || (exportMode === 'range' && !dateRange?.from) || isExporting}
                    className="flex-1 h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {isExporting ? 'Génération...' : 'Exporter'}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
