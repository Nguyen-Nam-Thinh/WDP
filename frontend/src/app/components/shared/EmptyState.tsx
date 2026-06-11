import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action, className = "" }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-dashed border-border p-10 text-center ${className}`}>
      {icon && <div className="mx-auto mb-3 text-muted-foreground [&>svg]:mx-auto [&>svg]:h-8 [&>svg]:w-8">{icon}</div>}
      <div className="font-serif text-lg font-bold text-foreground">{title}</div>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
