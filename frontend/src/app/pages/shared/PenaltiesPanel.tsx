import { useCallback, useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { toast } from "sonner";
import { penaltyApi, type PenaltyTicket } from "../../api/penalty";
import { useWallet } from "../../hooks/useWallet";

interface Props {
  token: string | null;
  highlight?: boolean;
  onPaid?: () => void;
}

export function PenaltiesPanel({ token, highlight, onPaid }: Props) {
  const [tickets, setTickets] = useState<PenaltyTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmTicket, setConfirmTicket] = useState<PenaltyTicket | null>(
    null,
  );
  const { balance, refetch: refetchWallet } = useWallet();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await penaltyApi.listMine(token);
      setTickets(list);
    } catch (err: any) {
      toast.error(err.message || "Không tải được phiếu phạt");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const doPay = async () => {
    const t = confirmTicket;
    if (!t || !token) return;

    if (balance != null && balance < t.amount) {
      toast.error(
        `Số dư không đủ (cần ${t.amount.toLocaleString("vi-VN")}, còn ${balance.toLocaleString("vi-VN")})`,
      );
      setConfirmTicket(null);
      return;
    }

    setPayingId(t._id);
    try {
      await penaltyApi.pay(token, t._id);
      toast.success("Đã nộp phạt thành công");
      setConfirmTicket(null);
      await Promise.all([load(), refetchWallet?.()]);
      onPaid?.();
    } catch (err: any) {
      toast.error(err.message || "Nộp phạt thất bại");
    } finally {
      setPayingId(null);
    }
  };

  const open = tickets.filter((t) => t.status === "open");

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <CircularProgress size={24} sx={{ color: "#C9A227" }} />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-slate-500">Không có phiếu phạt steward</p>
    );
  }

  const confirmRace =
    confirmTicket && typeof confirmTicket.raceId === "object"
      ? confirmTicket.raceId.name
      : "cuộc đua";

  return (
    <>
      <div id="penalties-panel" className={`space-y-3 }`}>
        {tickets.map((t) => {
          const raceName =
            typeof t.raceId === "object" ? t.raceId.name : "Race";
          const horseName =
            t.horseId && typeof t.horseId === "object" ? t.horseId.name : "";
          return (
            <div
              key={t._id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-xl px-4 py-3 bg-card"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground truncate">
                  {raceName}
                  {horseName ? ` · ${horseName}` : ""}
                </div>
                <div className="text-xs text-slate-500">
                  Số tiền phạt: {t.amount.toLocaleString("vi-VN")} coins · Loại
                  vi phạm:{t.note ? `  ${t.note}` : ""}
                </div>
              </div>
              {t.status === "open" ? (
                <Button
                  type="button"
                  size="small"
                  variant="contained"
                  disabled={payingId === t._id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmTicket(t);
                  }}
                  sx={{
                    background: "#8C2F1B",
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: 110,
                  }}
                >
                  Nộp phạt
                </Button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 uppercase">
                  {t.status}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!confirmTicket}
        onClose={() => !payingId && setConfirmTicket(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: "#FFFFFF",
            border: "1px solid #E3DCCB",
            borderRadius: 16,
          },
        }}
      >
        <DialogTitle sx={{ color: "#23201A", fontWeight: 700 }}>
          Xác nhận nộp phạt
        </DialogTitle>
        <DialogContent>
          <p className="text-sm text-[#5C564A]">
            Nộp{" "}
            <strong>
              {confirmTicket?.amount.toLocaleString("vi-VN")} coins
            </strong>{" "}
            cho phiếu phạt
            {confirmRace ? ` — ${confirmRace}` : ""}?
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Số dư sẽ bị trừ ngay từ ví.
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={!!payingId}
            onClick={() => setConfirmTicket(null)}
            sx={{ color: "#7A7468", textTransform: "none" }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={!!payingId}
            onClick={doPay}
            sx={{
              background: "#8C2F1B",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {payingId ? "Đang nộp…" : "Xác nhận nộp"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
