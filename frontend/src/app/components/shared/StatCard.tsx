import type { ReactNode } from "react";

export function StatCard({ label, value, gold = false, className = "" }: { label: string; value: ReactNode; gold?: boolean; className?: string }) {
  return (
    <div className={`bg-card border border-border p-4 ${className}`}>
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{label}</div>
      <div className={`font-serif text-2xl font-bold mt-1 ${gold ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
