import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

interface LiveStatProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage" | "time";
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  animate?: boolean;
}

export function LiveStat({ 
  label, 
  value, 
  format = "number", 
  trend,
  animate = false 
}: LiveStatProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animate) {
      const increment = value / 20;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, 50);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `R$ ${val.toFixed(2)}`;
      case "percentage":
        return `${val}%`;
      case "time": {
        const hours = Math.floor(val / 60);
        const minutes = val % 60;
        return `${hours}h ${minutes}min`;
      }
      default:
        return val.toString();
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 hover-scale">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend.direction === "up" ? "text-ai-success" : "text-ai-escalated"
          }`}>
            {trend.direction === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold gradient-text">
        {formatValue(displayValue)}
      </div>
    </div>
  );
}

export function LiveStatsGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <LiveStat 
        label="IA Trabalhando Agora" 
        value={3} 
        animate 
        trend={{ value: 50, direction: "up" }}
      />
      <LiveStat 
        label="Receita Hoje" 
        value={3240} 
        format="currency" 
        animate 
        trend={{ value: 23, direction: "up" }}
      />
      <LiveStat 
        label="Taxa de Resolução" 
        value={87} 
        format="percentage" 
        trend={{ value: 5, direction: "up" }}
      />
      <LiveStat 
        label="Tempo Economizado" 
        value={263} 
        format="time" 
        animate 
        trend={{ value: 12, direction: "up" }}
      />
    </div>
  );
}
