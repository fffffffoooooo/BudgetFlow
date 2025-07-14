import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Filter, X, ArrowUpDown, ArrowUp, ArrowDown,
  Calendar, DollarSign, Tag, Search, Clock,
  TrendingUp, TrendingDown, Target, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AdvancedFiltersProps {
  filters: any;
  categories: any[];
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  filterCount: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  categories,
  onFilterChange,
  onReset,
  isExpanded,
  onToggleExpanded,
  filterCount
}) => {
  const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

  const statusOptions = [
    { value: 'all', label: 'Toutes les périodes', icon: Clock },
    { value: 'recent', label: 'Récentes (7 jours)', icon: TrendingUp },
    { value: 'old', label: 'Anciennes (>30 jours)', icon: Clock },
    { value: 'thisWeek', label: 'Cette semaine', icon: Calendar },
    { value: 'thisMonth', label: 'Ce mois', icon: Calendar },
    { value: 'thisYear', label: 'Cette année', icon: Calendar },
  ];

  const amountRangeOptions = [
    { value: 'all', label: 'Tous les montants', icon: DollarSign },
    { value: 'small', label: 'Petits (< 50€)', icon: DollarSign },
    { value: 'medium', label: 'Moyens (50-200€)', icon: DollarSign },
    { value: 'large', label: 'Gros (200-1000€)', icon: DollarSign },
    { value: 'veryLarge', label: 'Très gros (>1000€)', icon: DollarSign },
  ];

  const sortOptions = [
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'amount', label: 'Montant', icon: DollarSign },
    { value: 'description', label: 'Description', icon: Search },
    { value: 'category', label: 'Catégorie', icon: Tag },
  ];

  const categoryOptions = [
    { value: 'all', label: 'Toutes les catégories', icon: Tag },
    { value: 'with', label: 'Avec catégorie', icon: Tag },
    { value: 'without', label: 'Sans catégorie', icon: X },
  ];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Barre de recherche et boutons */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des transactions..."
                className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={onToggleExpanded}
              className="h-11 px-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
              {filterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {filterCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onReset}
              className="h-11 px-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Filtres avancés */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                {/* Première ligne de filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Type de transaction */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Type
                    </label>
                    <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="expense">Dépenses</SelectItem>
                        <SelectItem value="income">Revenus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catégorie */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Catégorie
                    </label>
                    <Select value={filters.categoryId} onValueChange={(value) => onFilterChange('categoryId', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes les catégories</SelectItem>
                        {categories
                          .filter(cat => filters.type === 'all' || cat.type === filters.type)
                          .map(category => (
                            <SelectItem key={category._id} value={category._id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Devise */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Devise
                    </label>
                    <Select value={filters.currency} onValueChange={(value) => onFilterChange('currency', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Toutes les devises" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les devises</SelectItem>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Présence de catégorie */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Catégorisation
                    </label>
                    <Select value={filters.hasCategory} onValueChange={(value) => onFilterChange('hasCategory', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-3 w-3" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Deuxième ligne de filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Statut temporel */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Période
                    </label>
                    <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-3 w-3" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plage de montant */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Plage de montant
                    </label>
                    <Select value={filters.amountRange} onValueChange={(value) => onFilterChange('amountRange', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {amountRangeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-3 w-3" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tri par */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Trier par
                    </label>
                    <Select value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-3 w-3" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ordre de tri */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      {filters.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      Ordre
                    </label>
                    <Select value={filters.sortOrder} onValueChange={(value) => onFilterChange('sortOrder', value)}>
                      <SelectTrigger className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="h-3 w-3" />
                            Décroissant
                          </div>
                        </SelectItem>
                        <SelectItem value="asc">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-3 w-3" />
                            Croissant
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Troisième ligne - Montants personnalisés */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant minimum
                    </label>
                    <Input
                      type="number"
                      placeholder="Montant min"
                      className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      value={filters.minAmount}
                      onChange={(e) => onFilterChange('minAmount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Montant maximum
                    </label>
                    <Input
                      type="number"
                      placeholder="Montant max"
                      className="h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      value={filters.maxAmount}
                      onChange={(e) => onFilterChange('maxAmount', e.target.value)}
                    />
                  </div>
                </div>

                {/* Résumé des filtres actifs */}
                {filterCount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Filtres actifs:</span>
                    {filters.type !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {filters.type === 'expense' ? 'Dépenses' : 'Revenus'}
                      </Badge>
                    )}
                    {filters.categoryId && (
                      <Badge variant="secondary" className="text-xs">
                        Catégorie sélectionnée
                      </Badge>
                    )}
                    {filters.currency !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Devise: {filters.currency}
                      </Badge>
                    )}
                    {filters.hasCategory !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {filters.hasCategory === 'with' ? 'Avec catégorie' : 'Sans catégorie'}
                      </Badge>
                    )}
                    {filters.status !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {statusOptions.find(s => s.value === filters.status)?.label}
                      </Badge>
                    )}
                    {filters.amountRange !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {amountRangeOptions.find(a => a.value === filters.amountRange)?.label}
                      </Badge>
                    )}
                    {(filters.minAmount || filters.maxAmount) && (
                      <Badge variant="secondary" className="text-xs">
                        Montant personnalisé
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters; 