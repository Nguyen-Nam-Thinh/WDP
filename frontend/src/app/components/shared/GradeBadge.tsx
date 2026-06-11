const GRADE_STYLES: Record<string, string> = {
  Maiden: "border border-muted-foreground text-muted-foreground",
  G3: "border border-primary text-primary",
  G2: "border border-secondary text-secondary",
  G1: "bg-gold text-foreground font-bold",
};

export function GradeBadge({ grade, className = "" }: { grade: string; className?: string }) {
  const style = GRADE_STYLES[grade] ?? GRADE_STYLES.Maiden;
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] font-semibold ${style} ${className}`}>
      {grade}
    </span>
  );
}
