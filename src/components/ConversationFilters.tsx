import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ConversationFiltersProps {
  onFilterChange: (filters: {
    startDate?: Date;
    endDate?: Date;
    serviceType?: string;
  }) => void;
}

export function ConversationFilters({ onFilterChange }: ConversationFiltersProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [serviceType, setServiceType] = useState<string>();

  const handleApply = () => {
    onFilterChange({ startDate, endDate, serviceType });
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setServiceType(undefined);
    onFilterChange({});
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, "PPP") : "Data início"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "PPP") : "Data fim"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
        </PopoverContent>
      </Popover>

      <Select value={serviceType} onValueChange={setServiceType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo de serviço" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bath">Banho</SelectItem>
          <SelectItem value="grooming">Banho e Tosa</SelectItem>
          <SelectItem value="hotel">Hotel</SelectItem>
          <SelectItem value="consulta">Consulta</SelectItem>
        </SelectContent>
      </Select>

      <Button size="sm" onClick={handleApply} className="btn-gradient text-white">
        <Filter className="w-4 h-4 mr-2" />
        Aplicar
      </Button>

      <Button size="sm" variant="outline" onClick={handleReset}>
        Limpar
      </Button>
    </div>
  );
}
