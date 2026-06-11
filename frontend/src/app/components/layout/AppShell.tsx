import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useWallet } from "../../hooks/useWallet";
import { CoinAmount } from "../shared/CoinAmount";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

interface AppShellProps {
  roleLabel: string;   // "HORSE OWNER" | "JOCKEY" | "SPECTATOR" | "REFEREE"
  nav: NavItem[];
  children: ReactNode;
}

export function AppShell({ roleLabel, nav, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { balance } = useWallet();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-52 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground">
        <Link to="/" className="font-serif text-lg font-bold">The Paddock</Link>
        <div className="mb-6 mt-0.5 text-[8px] uppercase tracking-[0.25em] opacity-60">{roleLabel}</div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-2.5 py-2 text-sm ${
                  active
                    ? "bg-sidebar-primary font-bold text-sidebar-primary-foreground"
                    : "opacity-85 hover:bg-sidebar-accent hover:opacity-100"
                }`}
              >
                <span className="[&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>
                {item.label}
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-secondary px-1.5 text-[10px] font-bold text-secondary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-3 text-xs">
          <div className="font-semibold">{user?.fullName ?? user?.email}</div>
          <button
            onClick={async () => { await logout(); navigate("/login"); }}
            className="mt-1 flex items-center gap-1 opacity-60 hover:opacity-100"
          >
            <LogOut className="h-3 w-3" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="text-xs text-muted-foreground">{roleLabel}</div>
          <div className="flex items-center gap-4">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="bg-primary px-3 py-1 text-xs text-primary-foreground">
              <CoinAmount amount={balance ?? 0} className="text-xs" />
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-5">{children}</main>
      </div>
    </div>
  );
}
