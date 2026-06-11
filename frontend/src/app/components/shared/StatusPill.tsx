const STATUS_STYLES: Record<string, { cls: string; label: string }> = {
  open: { cls: "bg-primary text-primary-foreground", label: "Open" },
  closed: { cls: "bg-muted text-muted-foreground", label: "Closed" },
  pre_check: { cls: "bg-gold text-foreground", label: "Pre-check" },
  running: { cls: "bg-secondary text-secondary-foreground", label: "● Live" },
  finished: { cls: "bg-muted-foreground text-white", label: "Finished" },
  cancelled: { cls: "border border-muted-foreground text-muted-foreground", label: "Cancelled" },
};

export function StatusPill({ status, className = "" }: { status: string; className?: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.closed;
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold ${s.cls} ${className}`}>
      {s.label}
    </span>
  );
}
