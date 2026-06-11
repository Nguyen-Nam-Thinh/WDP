import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const NAV_LINKS = [
  { to: "/tournaments", label: "Tournaments" },
  { to: "/rankings", label: "Rankings" },
  { to: "/predictions", label: "Predictions" },
];

export function PublicShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-primary bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-serif text-xl font-bold text-primary">The Paddock</Link>
          <nav className="flex items-center gap-6 text-sm">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={pathname === l.to ? "font-semibold text-secondary" : "text-foreground hover:text-primary"}
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link to="/spectator" className="bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
