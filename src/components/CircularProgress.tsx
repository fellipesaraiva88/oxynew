interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
}

export function CircularProgress({ 
  value, 
  size = "md", 
  label,
  showValue = true,
  color = "primary" 
}: CircularProgressProps) {
  const sizes = {
    sm: { width: 60, stroke: 4 },
    md: { width: 80, stroke: 6 },
    lg: { width: 120, stroke: 8 },
  };

  const colors = {
    primary: "text-primary",
    success: "text-ai-success",
    warning: "text-ai-pending",
    danger: "text-ai-escalated",
  };

  const { width, stroke } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height: width }}>
        <svg width={width} height={width} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted opacity-20"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colors[color]} smooth-transition`}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-foreground">
              {value}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="text-xs text-muted-foreground text-center">
          {label}
        </span>
      )}
    </div>
  );
}

export function AIConfidenceIndicator({ confidence }: { confidence: number }) {
  let color: "success" | "warning" | "danger" = "success";
  let status = "Alta confiança";

  if (confidence < 70) {
    color = "danger";
    status = "Baixa confiança - Requer revisão";
  } else if (confidence < 85) {
    color = "warning";
    status = "Confiança média";
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
      <CircularProgress 
        value={confidence} 
        size="sm" 
        color={color}
        showValue={true}
      />
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground mb-1">
          Confiança da IA
        </div>
        <div className="text-xs text-muted-foreground">
          {status}
        </div>
      </div>
    </div>
  );
}
