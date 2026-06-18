export function CoinAmount({ amount, gold = false, className = "" }: { amount: number; gold?: boolean; className?: string }) {
  return (
    <span className={`tabular-nums font-semibold ${gold ? "text-gold" : ""} ${className}`}>
      {amount.toLocaleString("vi-VN")} VNĐ
    </span>
  );
}
