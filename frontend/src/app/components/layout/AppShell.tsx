import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Bell, ChevronLeft, ChevronRight, CheckCheck, Trophy, Coins, Mail, X } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { useAuth } from "../../hooks/useAuth";
import { CoinAmount } from "../shared/CoinAmount";
import { ProfileDropdown } from "../ProfileDropdown";
import { notificationApi, type Notification } from "../../api/notification";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface AppShellProps {
  roleLabel: string;
  nav: NavItem[];
  children: ReactNode;
}

const TYPE_ICON: Record<string, ReactNode> = {
  bet_won:             <Trophy className="w-4 h-4 text-[#8F7318]" />,
  bet_lost:            <X className="w-4 h-4 text-destructive" />,
  bet_refunded:        <Coins className="w-4 h-4 text-primary" />,
  prize_received:      <Coins className="w-4 h-4 text-[#8F7318]" />,
  invitation_received: <Mail className="w-4 h-4 text-primary" />,
  invitation_accepted: <CheckCheck className="w-4 h-4 text-primary" />,
  invitation_rejected: <X className="w-4 h-4 text-destructive" />,
  race_finished:       <Trophy className="w-4 h-4 text-muted-foreground" />,
  race_cancelled:      <X className="w-4 h-4 text-muted-foreground" />,
  horse_grade_upgrade: <Trophy className="w-4 h-4 text-[#8F7318]" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function getNotificationPath(n: Notification, role: string): string | null {
  const { type, data } = n;
  switch (type) {
    case 'invitation_received':
      return '/jockey/invitations';
    case 'invitation_accepted':
    case 'invitation_rejected':
      return '/horse-owner/schedule';
    case 'horse_grade_upgrade':
      return '/horse-owner/horses';
    case 'prize_received':
      return '/horse-owner/results';
    case 'race_cancelled':
      if (role === 'owner') return '/horse-owner/schedule';
      if (role === 'jockey') return '/jockey/schedule';
      return '/rankings';
    case 'race_finished':
      if (role === 'owner') return '/horse-owner/results';
      if (role === 'jockey') return '/jockey/results';
      return data?.raceId ? `/predictions?raceId=${data.raceId}` : '/rankings';
    case 'bet_won':
    case 'bet_lost':
    case 'bet_refunded':
      return data?.raceId ? `/predictions?raceId=${data.raceId}` : '/predictions';
    default:
      return null;
  }
}

function NotificationPanel({ token, role, onClose }: { token: string; role: string; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    notificationApi.getNotifications(token, { limit: 30 })
      .then(d => { setNotifications(d.notifications); setUnreadCount(d.unreadCount); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleMarkRead = async (id: string) => {
    await notificationApi.markRead(token, id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleClickNotification = async (n: Notification) => {
    if (!n.isRead) await handleMarkRead(n._id);
    const path = getNotificationPath(n, role);
    if (path) {
      navigate(path);
      onClose();
    }
  };

  const handleMarkAll = async () => {
    await notificationApi.markAllRead(token);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">Thông Báo</span>
          {unreadCount > 0 && (
            <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" /> Đọc tất cả
            </button>
          )}
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Chưa có thông báo nào
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n._id}
              type="button"
              onClick={() => handleClickNotification(n)}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/40 ${
                !n.isRead ? 'bg-primary/5' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-medium text-foreground leading-snug ${!n.isRead ? 'font-semibold' : ''}`}>
                    {n.title}
                  </span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-secondary shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function BellButton({ token, role }: { token: string; role: string }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationApi.getUnreadCount(token).then(setUnread).catch(() => {});
    const interval = setInterval(() => {
      notificationApi.getUnreadCount(token).then(setUnread).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative p-1 rounded hover:bg-muted transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-secondary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          token={token}
          role={role}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function AppShell({ roleLabel, nav, children }: AppShellProps) {
  const { balance } = useWallet();
  const { token, user } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`sticky top-0 h-screen flex shrink-0 flex-col bg-sidebar py-5 text-sidebar-foreground overflow-y-auto transition-all duration-300 ${
          collapsed ? "w-14 px-2" : "w-52 px-3"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center mb-1 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <Link to="/" className="font-serif text-lg font-bold leading-none">
              The Paddock
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-sidebar-accent"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="mb-6 mt-0.5 text-[8px] uppercase tracking-[0.25em] opacity-60">
            {roleLabel}
          </div>
        )}
        {collapsed && <div className="mb-5" />}

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2 px-2.5 py-2 text-sm rounded transition-colors ${
                  active
                    ? "bg-sidebar-primary font-bold text-sidebar-primary-foreground"
                    : "opacity-85 hover:bg-sidebar-accent hover:opacity-100"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <span className="[&>svg]:h-4 [&>svg]:w-4 shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.badge ? (
                  <span className="ml-auto rounded-full bg-secondary px-1.5 text-[10px] font-bold text-secondary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            {token && <BellButton token={token} role={user?.role ?? ''} />}
            <span className="bg-primary px-3 py-1 text-xs text-primary-foreground">
              <CoinAmount amount={balance ?? 0} className="text-xs" />
            </span>
            <ProfileDropdown />
          </div>
        </header>
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
