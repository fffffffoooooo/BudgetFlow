import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, FileText, Calendar, Filter, 
  TrendingUp, TrendingDown, DollarSign, 
  FileSpreadsheet, X, Check,
  ArrowUpDown, ArrowUp, ArrowDown,
  Tag, Search, Clock,
  Target, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import DateRangeSelector from './DateRangeSelector';

interface ExportActionsProps {
  transactions: any[];
  onExport: (type: 'pdf' | 'csv', dateRange?: DateRange) => void;
  isLoading?: boolean;
}

const ExportActions: React.FC<ExportActionsProps> = ({
  transactions,
  onExport,
  isLoading = false
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'pdf' | 'csv' | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [exportMode, setExportMode] = useState<'all' | 'range'>('all');
  
  const handleExportClick = (type: 'pdf' | 'csv') => {
    setSelectedType(type);
    setShowExportModal(true);
  };

  const handleConfirmExport = () => {
    if (selectedType) {
      onExport(selectedType, exportMode === 'range' ? dateRange : undefined);
      setShowExportModal(false);
      setSelectedType(null);
      setDateRange(undefined);
      setExportMode('all');
      }
  };

  const getFilteredTransactions = () => {
    if (exportMode === 'all') return transactions;
    
    if (!dateRange?.from) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;
      
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
  };

  const filteredTransactions = getFilteredTransactions();
  
  return (
    <>
      {/* Bouton d'export principal */}
            <Button
              variant="outline"
        size="sm" 
        className="h-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/30 transition-all duration-300 group"
        onClick={() => handleExportClick('pdf')}
        disabled={isLoading}
      >
        <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
        Exporter
      </Button>

      {/* Modal d'export */}
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
                    <FileText className="h-5 w-5 text-blue-600" />
                    Exporter les transactions
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
                    <span className="text-gray-600 dark:text-gray-400">Transactions à exporter:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {filteredTransactions.length}
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
                    disabled={!selectedType || (exportMode === 'range' && !dateRange?.from)}
                    className="flex-1 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Exporter
          </Button>
    </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExportActions;
