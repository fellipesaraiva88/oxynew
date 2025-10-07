import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientTags } from "@/hooks/useClientTags";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Filter,
  X,
  Calendar,
  Dog,
  Activity,
  TrendingUp,
  MapPin,
  Clock,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientFiltersProps {
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
}

interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "range" | "toggle" | "tags";
  icon: any;
  options?: { value: string; label: string }[];
  range?: { min: number; max: number; step: number };
}

const FILTERS: FilterConfig[] = [
  {
    id: "status",
    label: "Status",
    type: "select",
    icon: Activity,
    options: [
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Inativo" },
      { value: "new", label: "Novo" },
      { value: "vip", label: "VIP" },
    ],
  },
  {
    id: "last_interaction",
    label: "Última Interação",
    type: "select",
    icon: Clock,
    options: [
      { value: "today", label: "Hoje" },
      { value: "week", label: "Esta Semana" },
      { value: "month", label: "Este Mês" },
      { value: "3months", label: "3 Meses" },
      { value: "never", label: "Nunca" },
    ],
  },
  {
    id: "pets_count",
    label: "Quantidade de Patients",
    type: "range",
    icon: Dog,
    range: { min: 0, max: 10, step: 1 },
  },
  {
    id: "engagement",
    label: "Engajamento",
    type: "range",
    icon: TrendingUp,
    range: { min: 0, max: 100, step: 10 },
  },
  {
    id: "region",
    label: "Região",
    type: "select",
    icon: MapPin,
    options: [
      { value: "norte", label: "Zona Norte" },
      { value: "sul", label: "Zona Sul" },
      { value: "leste", label: "Zona Leste" },
      { value: "oeste", label: "Zona Oeste" },
      { value: "centro", label: "Centro" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    type: "tags",
    icon: Tag,
  },
  {
    id: "has_pets",
    label: "Possui Patients",
    type: "toggle",
    icon: Dog,
  },
  {
    id: "has_bookings",
    label: "Tem Agendamentos",
    type: "toggle",
    icon: Calendar,
  },
];

export function ClientFilters({ activeFilters, onFiltersChange }: ClientFiltersProps) {
  const { availableTags } = useClientTags();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<Record<string, any>>({});

  // Quick filter chips
  const quickFilters = [
    { id: "new", label: "Novos", icon: Clock },
    { id: "active", label: "Ativos", icon: Activity },
    { id: "with-patients", label: "Com Patients", icon: Dog },
    { id: "high-value", label: "Alto Valor", icon: TrendingUp },
  ];

  const handleQuickFilter = (filterId: string) => {
    if (activeFilters.includes(filterId)) {
      onFiltersChange(activeFilters.filter((f) => f !== filterId));
    } else {
      onFiltersChange([...activeFilters, filterId]);
    }
  };

  const handleApplyFilters = () => {
    // Converter tempFilters em array de strings para activeFilters
    const newFilters = Object.entries(tempFilters)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}:${value}`);

    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({});
    onFiltersChange([]);
  };

  const activeFilterCount = activeFilters.length;

  return (
    <div className="flex items-center gap-2">
      {/* Quick Filters */}
      <div className="flex gap-2">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilters.includes(filter.id);
          return (
            <Badge
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                isActive && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleQuickFilter(filter.id)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {filter.label}
            </Badge>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Advanced Filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                variant="destructive"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filtros Avançados</h4>
              {Object.keys(tempFilters).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto py-1 px-2"
                >
                  Limpar
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                return (
                  <div key={filter.id} className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4" />
                      {filter.label}
                    </Label>

                    {filter.type === "select" && (
                      <Select
                        value={tempFilters[filter.id] || ""}
                        onValueChange={(value) =>
                          setTempFilters({ ...tempFilters, [filter.id]: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {filter.type === "range" && filter.range && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-8">
                          {tempFilters[filter.id]?.[0] || filter.range.min}
                        </span>
                        <Slider
                          value={tempFilters[filter.id] || [filter.range.min]}
                          onValueChange={(value) =>
                            setTempFilters({ ...tempFilters, [filter.id]: value })
                          }
                          min={filter.range.min}
                          max={filter.range.max}
                          step={filter.range.step}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {filter.range.max}
                        </span>
                      </div>
                    )}

                    {filter.type === "toggle" && (
                      <Switch
                        checked={tempFilters[filter.id] || false}
                        onCheckedChange={(checked) =>
                          setTempFilters({ ...tempFilters, [filter.id]: checked })
                        }
                      />
                    )}

                    {filter.type === "tags" && (
                      <div className="flex flex-wrap gap-1">
                        {availableTags.map((tag) => {
                          const isSelected = tempFilters.tags?.includes(tag.id);
                          return (
                            <Badge
                              key={tag.id}
                              variant={isSelected ? "default" : "outline"}
                              className={cn(
                                "cursor-pointer text-xs transition-all",
                                isSelected && tag.color,
                                isSelected && "text-white"
                              )}
                              onClick={() => {
                                const currentTags = tempFilters.tags || [];
                                if (currentTags.includes(tag.id)) {
                                  setTempFilters({
                                    ...tempFilters,
                                    tags: currentTags.filter((t: string) => t !== tag.id),
                                  });
                                } else {
                                  setTempFilters({
                                    ...tempFilters,
                                    tags: [...currentTags, tag.id],
                                  });
                                }
                              }}
                            >
                              {tag.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilters}
                className="flex-1 btn-gradient text-white"
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex gap-1 flex-wrap">
            {activeFilters.slice(0, 3).map((filter) => (
              <Badge key={filter} variant="secondary" className="text-xs">
                {filter.split(":")[0]}
                <button
                  onClick={() =>
                    onFiltersChange(activeFilters.filter((f) => f !== filter))
                  }
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{activeFilters.length - 3}
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
}