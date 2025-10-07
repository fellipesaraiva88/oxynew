import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface BipeFilterOptions {
  type?: "all" | "ai_unknown" | "limit_reached";
  status?: "all" | "pending" | "resolved";
  dateRange?: "all" | "today" | "week" | "month" | "custom";
  startDate?: Date;
  endDate?: Date;
  searchText?: string;
}

interface BipeFiltersProps {
  filters: BipeFilterOptions;
  onChange: (filters: BipeFilterOptions) => void;
}

export function BipeFilters({ filters, onChange }: BipeFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const activeFiltersCount = [
    filters.type !== "all",
    filters.status !== "all",
    filters.dateRange !== "all",
    !!filters.searchText,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onChange({
      type: "all",
      status: "all",
      dateRange: "all",
      searchText: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por cliente, pergunta..."
            value={filters.searchText || ""}
            onChange={(e) =>
              onChange({ ...filters, searchText: e.target.value })
            }
          />
          {filters.searchText && (
            <button
              onClick={() => onChange({ ...filters, searchText: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filtros Avançados</h4>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto py-1"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Tipo de BIPE</Label>
                  <Select
                    value={filters.type || "all"}
                    onValueChange={(value) =>
                      onChange({
                        ...filters,
                        type: value as BipeFilterOptions["type"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ai_unknown">IA Não Sabe</SelectItem>
                      <SelectItem value="limit_reached">
                        Handoff Ativo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      onChange({
                        ...filters,
                        status: value as BipeFilterOptions["status"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select
                    value={filters.dateRange || "all"}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setShowDatePicker(true);
                      }
                      onChange({
                        ...filters,
                        dateRange: value as BipeFilterOptions["dateRange"],
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última Semana</SelectItem>
                      <SelectItem value="month">Último Mês</SelectItem>
                      <SelectItem value="custom">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showDatePicker && filters.dateRange === "custom" && (
                  <div className="space-y-2 p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-xs">Data Inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.startDate ? (
                              format(filters.startDate, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(date) =>
                              onChange({ ...filters, startDate: date })
                            }
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Data Final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {filters.endDate ? (
                              format(filters.endDate, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(date) =>
                              onChange({ ...filters, endDate: date })
                            }
                            disabled={(date) =>
                              filters.startDate
                                ? date < filters.startDate
                                : false
                            }
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Tipo:{" "}
              {filters.type === "ai_unknown" ? "IA Não Sabe" : "Handoff Ativo"}
              <button
                onClick={() => onChange({ ...filters, type: "all" })}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status:{" "}
              {filters.status === "pending" ? "Pendente" : "Resolvido"}
              <button
                onClick={() => onChange({ ...filters, status: "all" })}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.dateRange !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Período:{" "}
              {filters.dateRange === "today"
                ? "Hoje"
                : filters.dateRange === "week"
                ? "Última Semana"
                : filters.dateRange === "month"
                ? "Último Mês"
                : "Personalizado"}
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    dateRange: "all",
                    startDate: undefined,
                    endDate: undefined,
                  })
                }
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-auto py-1 text-xs"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}
