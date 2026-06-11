# Frontend Redesign — Heritage Light Implementation Plan (Đợt 0–2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đại tu theme + layout frontend sang Heritage Editorial Light (spec: `docs/superpowers/specs/2026-06-11-frontend-redesign-design.md`), plan này phủ Đợt 0 (foundation), Đợt 1 (Landing), Đợt 2 (Auth). Đợt 3–6 (dashboards) sẽ có plan riêng sau khi foundation chạy.

**Architecture:** Tận dụng cơ chế hiện có của `theme.css`: file này remap toàn bộ palette Tailwind chuẩn (`slate`, `emerald`, `amber`, `purple`...) sang hex custom qua `@theme inline`. Viết lại bảng remap sang palette Heritage Light → toàn site đổi màu ngay mà chưa đụng page nào. Sau đó dựng shared components (`components/shared/`) + shells (`components/layout/`), rồi migrate page theo đợt.

**Tech Stack (THỰC TẾ — khác CLAUDE.md):** React 18 + Vite 6 + Tailwind v4 (`@theme inline`) + Radix UI (shadcn-style trong `components/ui/`) + react-router 7 + sonner + lucide-react. **KHÔNG có Ant Design, TanStack Query hay Zustand** — code là export từ Figma Make, API gọi qua module trong `src/app/api/`, auth qua `hooks/useAuth.tsx`.

**Verification:** Project không có test infra (không có script `test`). Mỗi task verify bằng `npm run build` (phải pass, chạy trong `frontend/`) + check thủ công trên `npm run dev`.

---

### Task 0: Baseline — xác nhận build sạch trước khi sửa

**Files:** không sửa file nào.

- [ ] **Step 1: Chạy build baseline**

Run: `cd frontend; npm run build`
Expected: build pass. Nếu fail, dừng lại báo user — không redesign trên nền build hỏng.

- [ ] **Step 2: Đọc API của useAuth và useWallet**

Run: đọc `frontend/src/app/hooks/useAuth.tsx` và `frontend/src/app/hooks/useWallet.ts`, ghi lại tên field thật (vd `user.fullName`, `logout()`, `balance`). Các task sau dùng `user`, `logout`, `isAuthenticated` — nếu tên thật khác, sửa code task theo tên thật.

### Task 1: Fonts — Playfair Display + Inter

**Files:**
- Modify: `frontend/src/styles/fonts.css` (toàn bộ file, hiện chỉ có 1 dòng import Outfit)

- [ ] **Step 1: Thay nội dung fonts.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600&family=Inter:wght@400;500;600;700;800&display=swap');
```

- [ ] **Step 2: Build**

Run: `cd frontend; npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/fonts.css
git commit -m "feat: switch fonts to playfair display + inter for heritage theme"
```

### Task 2: Viết lại theme.css — Heritage Light palette

**Files:**
- Modify: `frontend/src/styles/theme.css` (thay toàn bộ file)

Nguyên tắc remap: theme cũ là dark nên page dùng `bg-slate-950` làm nền tối, `text-slate-50` làm chữ sáng. Đảo scale: `slate-950` → kem sáng, `slate-50` → chữ đậm, để mọi page tự thành light mà không sửa class. `emerald`/`teal` (accent vàng cũ) → racing green; `amber` → gold; `purple`/`indigo` → burgundy.

- [ ] **Step 1: Thay toàn bộ theme.css bằng nội dung sau**

```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #F7F3EA;
  --foreground: #23201A;
  --card: #FFFFFF;
  --card-foreground: #23201A;
  --popover: #FFFFFF;
  --popover-foreground: #23201A;
  --primary: #1F3D2B;
  --primary-foreground: #F7F3EA;
  --secondary: #8C2F1B;
  --secondary-foreground: #FFFFFF;
  --muted: #EDE7D8;
  --muted-foreground: #7A7468;
  --accent: #EDE7D8;
  --accent-foreground: #1F3D2B;
  --destructive: #B42318;
  --destructive-foreground: #ffffff;
  --border: #E3DCCB;
  --input: transparent;
  --input-background: #FFFFFF;
  --switch-background: #C9C2B0;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: #1F3D2B;
  --gold: #C9A227;
  --chart-1: #1F3D2B;
  --chart-2: #8C2F1B;
  --chart-3: #C9A227;
  --chart-4: #7A7468;
  --chart-5: #E3DCCB;
  --radius: 0.25rem;
  --sidebar: #1F3D2B;
  --sidebar-foreground: #F7F3EA;
  --sidebar-primary: #F7F3EA;
  --sidebar-primary-foreground: #1F3D2B;
  --sidebar-accent: #2A4D38;
  --sidebar-accent-foreground: #F7F3EA;
  --sidebar-border: #2A4D38;
  --sidebar-ring: #C9A227;
}

/* .dark giữ nguyên giá trị light — site không còn dark mode riêng */
.dark {
  --background: #F7F3EA;
  --foreground: #23201A;
  --card: #FFFFFF;
  --card-foreground: #23201A;
  --popover: #FFFFFF;
  --popover-foreground: #23201A;
  --primary: #1F3D2B;
  --primary-foreground: #F7F3EA;
  --secondary: #8C2F1B;
  --secondary-foreground: #FFFFFF;
  --muted: #EDE7D8;
  --muted-foreground: #7A7468;
  --accent: #EDE7D8;
  --accent-foreground: #1F3D2B;
  --destructive: #B42318;
  --destructive-foreground: #ffffff;
  --border: #E3DCCB;
  --input: transparent;
  --input-background: #FFFFFF;
  --switch-background: #C9C2B0;
  --ring: #1F3D2B;
  --gold: #C9A227;
  --sidebar: #1F3D2B;
  --sidebar-foreground: #F7F3EA;
  --sidebar-primary: #F7F3EA;
  --sidebar-primary-foreground: #1F3D2B;
  --sidebar-accent: #2A4D38;
  --sidebar-accent-foreground: #F7F3EA;
  --sidebar-border: #2A4D38;
  --sidebar-ring: #C9A227;
}

@theme inline {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-serif: 'Playfair Display', Georgia, serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-gold: var(--gold);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* ── Palette remap: page cũ viết cho dark theme nên ĐẢO scale slate ──
     slate-950 (nền tối cũ) → kem sáng; slate-50 (chữ sáng cũ) → chữ đậm */
  --color-slate-50: #23201A;
  --color-slate-100: #2C2820;
  --color-slate-200: #4A4438;
  --color-slate-300: #5C5648;
  --color-slate-400: #7A7468;
  --color-slate-500: #9A937F;
  --color-slate-600: #C9C2B0;
  --color-slate-700: #E3DCCB;
  --color-slate-800: #EDE7D8;
  --color-slate-900: #FFFFFF;
  --color-slate-950: #F7F3EA;

  /* emerald (accent vàng neon cũ) → racing green */
  --color-emerald-50: #F0F4EF;
  --color-emerald-100: #DCE6DC;
  --color-emerald-200: #B5CCB8;
  --color-emerald-300: #6E9678;
  --color-emerald-400: #1F3D2B;
  --color-emerald-500: #1B3526;
  --color-emerald-600: #172D20;
  --color-emerald-700: #13251B;
  --color-emerald-800: #0F1E15;
  --color-emerald-900: #0B1710;
  --color-emerald-950: #07100B;

  --color-teal-400: #1F3D2B;
  --color-teal-500: #1B3526;
  --color-teal-600: #172D20;
  --color-teal-700: #13251B;
  --color-teal-800: #0F1E15;
  --color-teal-900: #0B1710;

  /* purple/indigo → burgundy */
  --color-purple-400: #8C2F1B;
  --color-purple-500: #7C2A18;
  --color-purple-600: #6B2415;
  --color-purple-700: #5A1F12;

  --color-indigo-400: #8C2F1B;
  --color-indigo-500: #7C2A18;
  --color-indigo-600: #6B2415;
  --color-indigo-700: #5A1F12;

  /* amber → gold heritage */
  --color-amber-400: #D9B53C;
  --color-amber-500: #C9A227;
  --color-amber-600: #B08D1E;
  --color-amber-700: #8F7318;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  html {
    font-size: var(--font-size);
  }

  h1, h2, h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 700;
    line-height: 1.15;
  }

  h1 { font-size: var(--text-3xl); }
  h2 { font-size: var(--text-2xl); }
  h3 { font-size: var(--text-xl); }
}
```

**LƯU Ý:** file hiện tại có thể có thêm rule sau dòng 199 (h3 trở đi) — đọc hết file trước khi thay, giữ lại rule nào không liên quan đến màu/font (vd utility riêng) nếu có.

- [ ] **Step 2: Build + xem thử**

Run: `cd frontend; npm run build` rồi `npm run dev`, mở Landing + Login.
Expected: build PASS; toàn site đổi sang nền sáng kem, chữ đậm, accent xanh/đỏ — layout chưa đổi, có thể còn vài chỗ tương phản xấu (sẽ sửa trong đợt migrate từng page).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/styles/theme.css
git commit -m "feat: rewrite theme to heritage light palette"
```

### Task 3: Dọn globals + Toaster cho light theme

**Files:**
- Modify: `frontend/src/styles/globals.css` (các rule scrollbar dùng `rgba(255,255,255,...)`)
- Modify: `frontend/src/main.tsx:9`

- [ ] **Step 1: Sửa scrollbar trong globals.css**

Tìm mọi `rgba(255,255,255,0.1)` → `rgba(35,32,26,0.15)`, `rgba(255,255,255,0.18)` → `rgba(35,32,26,0.25)` (scrollbar tối trên nền sáng). Đọc hết file, sửa luôn các rule khác hardcode màu sáng-trên-tối nếu có.

- [ ] **Step 2: Sửa Toaster trong main.tsx**

```tsx
<Toaster theme="light" position="top-right" richColors offset="80px" />
```

- [ ] **Step 3: Build + commit**

Run: `cd frontend; npm run build` → PASS

```bash
git add frontend/src/styles/globals.css frontend/src/main.tsx
git commit -m "feat: adapt scrollbars and toaster to light theme"
```

### Task 4: Shared primitives — GradeBadge, StatusPill, CoinAmount, WinProbBar

**Files:**
- Create: `frontend/src/app/components/shared/GradeBadge.tsx`
- Create: `frontend/src/app/components/shared/StatusPill.tsx`
- Create: `frontend/src/app/components/shared/CoinAmount.tsx`
- Create: `frontend/src/app/components/shared/WinProbBar.tsx`

- [ ] **Step 1: GradeBadge.tsx**

```tsx
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
```

- [ ] **Step 2: StatusPill.tsx**

```tsx
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
```

- [ ] **Step 3: CoinAmount.tsx**

```tsx
export function CoinAmount({ amount, gold = false, className = "" }: { amount: number; gold?: boolean; className?: string }) {
  return (
    <span className={`tabular-nums font-semibold ${gold ? "text-gold" : ""} ${className}`}>
      ₵ {amount.toLocaleString("en-US")}
    </span>
  );
}
```

- [ ] **Step 4: WinProbBar.tsx**

```tsx
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
```

- [ ] **Step 5: Build + commit**

Run: `cd frontend; npm run build` → PASS

```bash
git add frontend/src/app/components/shared/
git commit -m "feat: add heritage shared primitives (grade, status, coin, winprob)"
```

### Task 5: Shared cards — StatCard, PageHeader, RaceCard, EmptyState

**Files:**
- Create: `frontend/src/app/components/shared/StatCard.tsx`
- Create: `frontend/src/app/components/shared/PageHeader.tsx`
- Create: `frontend/src/app/components/shared/RaceCard.tsx`
- Create: `frontend/src/app/components/shared/EmptyState.tsx`

- [ ] **Step 1: StatCard.tsx**

```tsx
import type { ReactNode } from "react";

export function StatCard({ label, value, gold = false, className = "" }: { label: string; value: ReactNode; gold?: boolean; className?: string }) {
  return (
    <div className={`bg-card border border-border p-4 ${className}`}>
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{label}</div>
      <div className={`font-serif text-2xl font-bold mt-1 ${gold ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: PageHeader.tsx**

```tsx
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action, className = "" }: { title: string; subtitle?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 3: RaceCard.tsx**

```tsx
import type { ReactNode } from "react";
import { GradeBadge } from "./GradeBadge";
import { StatusPill } from "./StatusPill";
import { CoinAmount } from "./CoinAmount";

interface RaceCardProps {
  name: string;
  grade: string;
  status: string;
  distance?: number;
  purse?: number;
  scheduledTime?: string;
  eyebrow?: string;
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function RaceCard({ name, grade, status, distance, purse, scheduledTime, eyebrow, footer, onClick, className = "" }: RaceCardProps) {
  const meta = [
    distance ? `${distance}m` : null,
    scheduledTime ? new Date(scheduledTime).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }) : null,
  ].filter(Boolean).join(" · ");

  return (
    <div
      className={`bg-card border border-border p-4 ${onClick ? "cursor-pointer hover:border-primary transition-colors" : ""} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        {eyebrow && <div className="text-[9px] uppercase tracking-[0.2em] text-secondary font-bold">{eyebrow}</div>}
        <StatusPill status={status} className="ml-auto" />
      </div>
      <div className="font-serif text-lg font-bold text-foreground mt-1 flex items-center gap-2">
        {name} <GradeBadge grade={grade} />
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {meta}
        {purse != null && <> · Purse <CoinAmount amount={purse} gold className="text-xs" /></>}
      </div>
      {footer && <div className="mt-3 pt-3 border-t border-border">{footer}</div>}
    </div>
  );
}
```

- [ ] **Step 4: EmptyState.tsx**

```tsx
import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action, className = "" }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-dashed border-border p-10 text-center ${className}`}>
      {icon && <div className="mx-auto mb-3 text-muted-foreground [&>svg]:mx-auto [&>svg]:h-8 [&>svg]:w-8">{icon}</div>}
      <div className="font-serif text-lg font-bold text-foreground">{title}</div>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 5: Build + commit**

Run: `cd frontend; npm run build` → PASS

```bash
git add frontend/src/app/components/shared/
git commit -m "feat: add heritage shared cards (stat, page header, race, empty state)"
```

### Task 6: PublicShell + AppShell

**Files:**
- Create: `frontend/src/app/components/layout/PublicShell.tsx`
- Create: `frontend/src/app/components/layout/AppShell.tsx`

Trước khi viết: đọc `frontend/src/app/components/Navbar.tsx` (top-nav hiện tại) và `hooks/useAuth.tsx`, `hooks/useWallet.ts` để khớp tên field thật (Task 0 Step 2 đã ghi lại). Code dưới dùng `useAuth()` trả `{ user, isAuthenticated, logout }` và `useWallet()` trả `{ balance }` — chỉnh theo tên thật nếu khác.

- [ ] **Step 1: PublicShell.tsx**

```tsx
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
```

- [ ] **Step 2: AppShell.tsx**

```tsx
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
            onClick={() => { logout(); navigate("/login"); }}
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
```

- [ ] **Step 3: Build + commit**

Run: `cd frontend; npm run build` → PASS (shells chưa được dùng ở đâu, chỉ cần compile sạch)

```bash
git add frontend/src/app/components/layout/
git commit -m "feat: add AppShell and PublicShell heritage layouts"
```

### Task 7: Đợt 1 — Migrate LandingPage

**Files:**
- Modify: `frontend/src/app/pages/LandingPage.tsx` (~33KB — đọc toàn bộ trước khi sửa)
- Có thể modify: `frontend/src/app/components/Navbar.tsx` (nếu Landing dùng Navbar)

Đây là task migrate, không có code sẵn — quy trình:

- [ ] **Step 1: Đọc LandingPage.tsx toàn bộ**, ghi lại: cấu trúc section (hero, features, CTA...), chỗ nào gọi API, chỗ nào dùng GSAP/motion animation (GIỮ NGUYÊN logic + animation hooks).

- [ ] **Step 2: Thay nav hiện tại bằng `PublicShell`** (wrap nội dung page), xoá markup nav trùng lặp trong page.

- [ ] **Step 3: Áp class mapping cho từng section** theo bảng:

| Class cũ (dark idiom) | Thay bằng |
|---|---|
| `bg-slate-950`, `bg-[#1B0C0C]`, `bg-black` | `bg-background` |
| `bg-slate-900`, `bg-[#241414]` | `bg-card` |
| `text-slate-50`, `text-white` | `text-foreground` |
| `text-slate-400` | `text-muted-foreground` |
| `text-emerald-400`, `text-[#FFDE42]` | `text-primary` (hoặc `text-gold` nếu là số tiền/prize) |
| `bg-emerald-400 text-slate-950` (button) | `bg-primary text-primary-foreground` |
| `border-slate-800`, `border-white/10` | `border-border` |
| gradient tối (`from-slate-950...`) | bỏ gradient, nền phẳng `bg-background` |
| heading lớn | thêm `font-serif` |

Hex hardcode (`#FFDE42`, `#1B0C0C`...) phải thay thủ công — palette remap không phủ được arbitrary value.

- [ ] **Step 4: Verify thủ công:** `npm run dev`, mở `/` — hero, CTA, mọi section nền sáng, không còn mảng tối sót, link nav hoạt động, animation còn chạy.

- [ ] **Step 5: Build + commit**

Run: `cd frontend; npm run build` → PASS

```bash
git add frontend/src/app/pages/LandingPage.tsx frontend/src/app/components/Navbar.tsx
git commit -m "feat: migrate landing page to heritage light with PublicShell"
```

### Task 8: Đợt 2 — Migrate Auth (Login, Register, ForgotPassword)

**Files:**
- Modify: `frontend/src/app/pages/Login.tsx` (~11KB)
- Modify: `frontend/src/app/pages/Register.tsx` (~12KB)
- Modify: `frontend/src/app/pages/ForgotPassword.tsx` (~13KB)

- [ ] **Step 1: Migrate Login.tsx** — đọc toàn bộ file; GIỮ NGUYÊN logic submit/validation/error; áp class mapping của Task 7 Step 3. Layout chuẩn: card trắng border mảnh giữa nền kem, logo serif "The Paddock" trên cùng, button submit `bg-primary`, link phụ `text-secondary`.

- [ ] **Step 2: Verify Login thủ công** — `npm run dev`, đăng nhập bằng tài khoản test phải vào dashboard như trước.

- [ ] **Step 3: Migrate Register.tsx** — cùng quy trình + style với Step 1 (giữ logic chọn role nếu có).

- [ ] **Step 4: Migrate ForgotPassword.tsx** — cùng quy trình.

- [ ] **Step 5: Build + verify cả 3 trang + commit**

Run: `cd frontend; npm run build` → PASS

```bash
git add frontend/src/app/pages/Login.tsx frontend/src/app/pages/Register.tsx frontend/src/app/pages/ForgotPassword.tsx
git commit -m "feat: migrate auth pages to heritage light"
```

### Task 9: Checkpoint + plan đợt kế

- [ ] **Step 1: Smoke test toàn site** — `npm run dev`, đi qua: `/` → `/login` → đăng nhập từng role → dashboard tương ứng mở được (dashboard chưa redesign nhưng phải DÙNG ĐƯỢC với palette mới, không trắng chữ trên nền trắng). Ghi lại mọi chỗ vỡ tương phản để fix trong đợt migrate page đó.

- [ ] **Step 2: Báo cáo user** — show kết quả, xác nhận trước khi lập plan Đợt 3 (nhóm Spectator: Tournaments, Rankings, Predictions, LiveRace, SpectatorDashboard) — plan riêng vì cần đọc từng file lớn.

---

## Ngoài phạm vi plan này
- Đợt 3–6 (Spectator group, Owner, Jockey/Referee, trang phụ trợ) — mỗi đợt 1 plan riêng sau checkpoint Task 9.
- `HorseCard`, `JockeyCard` (trong spec) — tạo trong plan Đợt 3/4 khi dashboard cần, theo đúng style Task 5.
- Trang Admin, mobile app, backend.
