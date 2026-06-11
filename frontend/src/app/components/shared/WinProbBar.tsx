export function WinProbBar({ label, probability, className = "" }: { label: string; probability: number; className?: string }) {
  const pct = Math.round(probability * 1000) / 10;
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-secondary">{label}</span>
        <span className="font-serif text-base font-bold text-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1 bg-[#EDE7D8]">
        <div className="h-1 bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
