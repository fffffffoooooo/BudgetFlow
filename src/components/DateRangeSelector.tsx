import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CalendarDays,
  CalendarRange,
  X
} from "lucide-react";
import { DateRange } from 'react-day-picker';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions = [
    {
      label: "Aujourd'hui",
      value: "today",
      getRange: () => {
        const today = new Date();
        return { from: today, to: today };
      }
    },
    {
      label: "Hier",
      value: "yesterday",
      getRange: () => {
        const yesterday = addDays(new Date(), -1);
        return { from: yesterday, to: yesterday };
      }
    },
    {
      label: "Cette semaine",
      value: "thisWeek",
      getRange: () => {
        const now = new Date();
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
      }
    },
    {
      label: "Semaine dernière",
      value: "lastWeek",
      getRange: () => {
        const now = new Date();
        const lastWeek = addDays(now, -7);
        return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
      }
    },
    {
      label: "Ce mois",
      value: "thisMonth",
      getRange: () => {
        const now = new Date();
        return { from: startOfMonth(now), to: endOfMonth(now) };
      }
    },
    {
      label: "Mois dernier",
      value: "lastMonth",
      getRange: () => {
        const now = new Date();
        const lastMonth = subMonths(now, 1);
        return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
      }
    },
    {
      label: "Cette année",
      value: "thisYear",
      getRange: () => {
        const now = new Date();
        return { from: startOfYear(now), to: endOfYear(now) };
      }
    },
    {
      label: "7 derniers jours",
      value: "last7Days",
      getRange: () => {
        const now = new Date();
        return { from: addDays(now, -6), to: now };
      }
    },
    {
      label: "30 derniers jours",
      value: "last30Days",
      getRange: () => {
        const now = new Date();
        return { from: addDays(now, -29), to: now };
      }
    }
  ];

  const handleQuickSelect = (option: typeof quickOptions[0]) => {
    const range = option.getRange();
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (!dateRange?.from) {
      return "Sélectionner une période";
    }
    
    if (dateRange.to) {
      if (dateRange.from.getTime() === dateRange.to.getTime()) {
        return format(dateRange.from, 'dd MMM yyyy', { locale: fr });
      }
      return `${format(dateRange.from, 'dd MMM', { locale: fr })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: fr })}`;
    }
    
    return format(dateRange.from, 'dd MMM yyyy', { locale: fr });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200",
            !dateRange && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left">{getDisplayText()}</span>
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Options rapides */}
          <div className="border-r border-gray-200 dark:border-gray-700 p-4 w-48">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Périodes rapides
              </h4>
              {quickOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-8 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-300"
                  onClick={() => handleQuickSelect(option)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Calendrier */}
          <div className="p-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={fr}
              className="rounded-md border-0"
            />
            
            {/* Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-xs"
              >
                Effacer
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs bg-blue-600 hover:bg-blue-700"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeSelector; 