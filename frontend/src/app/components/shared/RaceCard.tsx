import type { ReactNode } from "react";
import { GradeBadge } from "./GradeBadge";
import { StatusPill } from "./StatusPill";
import { CoinAmount } from "./CoinAmount";

interface RaceCardProps {
  name: string;
  grade: string;
  status: string;
  distance?: number;
  purse?: number;
  scheduledTime?: string;
  eyebrow?: string;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function RaceCard({ name, grade, status, distance, purse, scheduledTime, eyebrow, footer, onClick, className = "" }: RaceCardProps) {
  const meta = [
    distance ? `${distance}m` : null,
    scheduledTime ? new Date(scheduledTime).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div
      className={`bg-card border border-border p-4 ${onClick ? "cursor-pointer hover:border-primary transition-colors" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {eyebrow && <div className="text-[9px] uppercase tracking-[0.2em] text-secondary font-bold">{eyebrow}</div>}
        <StatusPill status={status} className="ml-auto" />
      </div>
      <div className="font-serif text-lg font-bold text-foreground mt-1 flex items-center gap-2">
        {name} <GradeBadge grade={grade} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {meta}
        {purse != null && <> · Purse <CoinAmount amount={purse} gold className="text-xs" /></>}
      </div>
      {footer && <div className="mt-3 pt-3 border-t border-border">{footer}</div>}
    </div>
  );
}
