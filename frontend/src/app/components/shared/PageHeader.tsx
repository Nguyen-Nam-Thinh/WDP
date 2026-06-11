import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action, className = "" }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
