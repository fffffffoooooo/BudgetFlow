
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { api } from '@/services/api';
import { addDays } from 'date-fns';
import debounce from 'lodash/debounce';
import { DateRange } from 'react-day-picker';

interface TransactionFilters {
  search: string;
  categoryId: string;
  startDate: Date | null;
  endDate: Date | null;
  type: 'all' | 'expense' | 'income';
  minAmount: string;
  maxAmount: string;
}

interface FiltersPanelProps {
  onFilterChange?: (filters: any) => void;
  onApplyFilters?: (filters: { search?: string; categoryId?: string; startDate?: string; endDate?: string; }) => void;
  onResetFilters?: () => void;
  expanded?: boolean;
  onExpandToggle?: () => void;
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({ 
  onFilterChange,
  onApplyFilters, 
  onResetFilters,
  expanded = false, 
  onExpandToggle 
}) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    categoryId: '',
    startDate: addDays(new Date(), -30),
    endDate: new Date(),
    type: 'all',
    minAmount: '',
    maxAmount: '',
  });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Charger les catégories depuis le backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Appliquer les filtres avec un délai pour éviter trop d'appels API
  const debouncedFilterChange = useCallback(
    debounce((newFilters) => {
      // Transformer les filtres pour l'API
      const apiFilters = {
        search: newFilters.search,
        categoryId: newFilters.categoryId !== '' ? newFilters.categoryId : undefined,
        startDate: newFilters.startDate ? newFilters.startDate.toISOString() : undefined,
        endDate: newFilters.endDate ? newFilters.endDate.toISOString() : undefined,
        type: newFilters.type !== 'all' ? newFilters.type : undefined,
        minAmount: newFilters.minAmount !== '' ? parseFloat(newFilters.minAmount) : undefined,
        maxAmount: newFilters.maxAmount !== '' ? parseFloat(newFilters.maxAmount) : undefined,
      };
      
      // Utiliser onFilterChange ou onApplyFilters selon ce qui est disponible
      if (onFilterChange) {
        onFilterChange(apiFilters);
      } else if (onApplyFilters) {
        onApplyFilters(apiFilters);
      }
    }, 300),
    [onFilterChange, onApplyFilters]
  );
  
  // Mettre à jour les filtres et appliquer le changement
  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };
  
  // Gérer le changement de plage de dates
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      handleFilterChange('startDate', range.from);
      handleFilterChange('endDate', range.to);
    }
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      categoryId: '',
      startDate: addDays(new Date(), -30),
      endDate: new Date(),
      type: 'all' as const,
      minAmount: '',
      maxAmount: '',
    };
    
    setFilters(defaultFilters);
    setDateRange({
      from: addDays(new Date(), -30),
      to: new Date(),
    });
    
    debouncedFilterChange(defaultFilters);
    
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <Card className="mb-4 border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* Barre de recherche et bouton d'expansion toujours visibles */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher des transactions..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            {onExpandToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExpandToggle}
                className="gap-1"
              >
                Filtres 
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
          
          {/* Filtres avancés qui peuvent être masqués/affichés */}
          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => handleFilterChange('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value: 'all' | 'expense' | 'income') => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="expense">Dépenses</SelectItem>
                    <SelectItem value="income">Revenus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Période</Label>
                <DatePickerWithRange 
                  date={dateRange}
                  setDate={handleDateRangeChange}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Montant minimum</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Montant maximum</Label>
                <Input
                  type="number"
                  placeholder="Maximum"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="w-full"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersPanel;
