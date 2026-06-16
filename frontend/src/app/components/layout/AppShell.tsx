import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { CoinAmount } from "../shared/CoinAmount";
import { ProfileDropdown } from "../ProfileDropdown";

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

export function AppShell({ roleLabel, nav, children }: AppShellProps) {
  const { balance } = useWallet();
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
            <Bell className="h-4 w-4 text-muted-foreground" />
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
