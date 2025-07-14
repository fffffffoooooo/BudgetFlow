
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
}: DatePickerWithRangeProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "d MMM yyyy", { locale: fr })} -{" "}
                  {format(date.to, "d MMM yyyy", { locale: fr })}
                </>
              ) : (
                format(date.from, "d MMM yyyy", { locale: fr })
              )
            ) : (
              <span>Sélectionner une période</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={fr}
            classNames={{
              day_selected: "bg-primary text-primary-foreground",
              day_range_middle: "bg-primary/50 text-primary-foreground/80",
              day_today: "bg-accent text-accent-foreground",
            }}
          />
          <div className="p-3 border-t flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                setDate({
                  from: addDays(today, -30),
                  to: today
                });
              }}
            >
              30 derniers jours
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                setDate({
                  from: new Date(today.getFullYear(), today.getMonth(), 1),
                  to: today
                });
              }}
            >
              Ce mois
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
