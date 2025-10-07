import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 fade-in">
      <div>
        <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-ocean-blue to-sky-blue bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 text-base">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
