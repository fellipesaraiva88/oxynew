import { AlertCircle, RefreshCw } from "lucide-react";

export function DashboardCardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-24 mb-2"></div>
      <div className="h-8 bg-muted rounded w-16 mb-2"></div>
      <div className="h-3 bg-muted rounded w-32"></div>
    </div>
  );
}

export function ImpactCardSkeleton() {
  return (
    <div className="neuro-card rounded-2xl p-6 animate-pulse">
      <div className="bg-muted rounded-xl w-12 h-12 mb-4"></div>
      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
      <div className="h-10 bg-muted rounded w-24 mb-1"></div>
      <div className="h-4 bg-muted rounded w-40 mb-3"></div>
      <div className="h-6 bg-muted rounded-full w-32"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-48 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 bg-muted rounded w-12"></div>
            <div className="flex-1 h-8 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-64 mb-6"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl">
            <div className="bg-muted rounded-lg w-10 h-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
              <div className="h-5 bg-muted rounded-full w-32"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Erro ao carregar dados", onRetry }: ErrorStateProps) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="bg-red-500/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <p className="text-lg font-semibold text-foreground mb-2">Ops!</p>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      {icon && (
        <div className="bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
