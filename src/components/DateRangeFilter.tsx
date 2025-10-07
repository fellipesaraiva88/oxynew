import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  onRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  const handleSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onRangeChange({
      from: newDate?.from,
      to: newDate?.to,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
              </>
            ) : (
              format(date.from, "dd/MM/yyyy")
            )
          ) : (
            "Selecionar período"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
