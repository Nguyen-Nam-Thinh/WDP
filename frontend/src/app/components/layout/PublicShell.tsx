import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ProfileDropdown } from "../ProfileDropdown";

const NAV_LINKS = [
  { to: "/tournaments", label: "Giải Đấu" },
  { to: "/rankings", label: "Bảng Xếp Hạng" },
  { to: "/predictions", label: "Dự Đoán" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="The Paddock" className="h-10 w-10 object-contain" />
            <span className="font-serif text-xl font-bold text-primary">The Paddock</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={
                  pathname === l.to
                    ? "font-semibold text-secondary"
                    : "text-foreground transition-colors hover:text-primary"
                }
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <ProfileDropdown />
            ) : (
              <>
                <Link to="/login" className="text-foreground transition-colors hover:text-primary">
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Bắt Đầu Ngay
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
