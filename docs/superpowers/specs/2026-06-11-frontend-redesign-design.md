# Frontend Redesign — Heritage Editorial Light

**Ngày:** 2026-06-11
**Phạm vi:** Đại tu layout + theme toàn bộ frontend web, ngoại trừ trang Admin.
**Nguyên tắc:** Chỉ đổi tầng trình bày (JSX/markup/CSS). Giữ nguyên hooks, TanStack Query, Zustand stores, Socket.IO handlers và mọi business logic.

## 1. Hướng thiết kế

Theme **Heritage Editorial Light** — phong cách báo chí/heritage đua ngựa cổ điển, thay thế hoàn toàn theme dark nâu-đen + vàng neon hiện tại. Tên hiển thị brand trong UI mockup: "The Paddock" (có thể đổi khi implement).

### 1.1. Design tokens (thay toàn bộ `frontend/src/styles/theme.css`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--background` | `#F7F3EA` | Nền chính (kem sáng) |
| `--card` | `#FFFFFF` | Card, panel |
| `--primary` | `#1F3D2B` | Racing green — nav, button chính, link |
| `--accent` | `#8C2F1B` | Burgundy — Place Bet, LIVE, eyebrow label |
| `--gold` | `#C9A227` | Prize, earnings, G1 badge |
| `--foreground` | `#23201A` | Text chính |
| `--muted-foreground` | `#7A7468` | Text phụ |
| `--border` | `#E3DCCB` | Border mảnh |
| `--progress-track` | `#EDE7D8` | Track của progress/prob bar |

**Màu chức năng:**
- Race status pill: `open` = green `#1F3D2B`, `pre_check` = gold `#C9A227`, `running/LIVE` = burgundy `#8C2F1B`, `finished` = muted `#7A7468`, `cancelled` = outline muted.
- Grade badge: Maiden = outline muted, G3 = outline green, G2 = outline burgundy, G1 = nền gold đậm.

### 1.2. Typography

- **Heading / tên race / page title:** Playfair Display (serif), bold. Fallback Georgia.
- **Body / bảng / form:** Inter (sans-serif). Fallback Arial.
- **Số liệu trong bảng:** `font-variant-numeric: tabular-nums`.
- **Eyebrow/label:** uppercase, letter-spacing rộng, burgundy hoặc muted.

### 1.3. Component style

- Card: nền trắng, border mảnh `#E3DCCB`, góc vuông hoặc radius rất nhỏ, không shadow đậm.
- Button: chữ in hoa tracked. Primary = nền green, Secondary = outline green, hành động cược = nền burgundy.
- Ant Design giữ cho Table/Form/Modal phức tạp, restyle qua `ConfigProvider` theme token cho khớp palette.

## 2. Layout

### 2.1. AppShell (trang sau đăng nhập: Owner, Jockey, Spectator, Referee)

Sidebar cố định bên trái (layout B đã duyệt):

- **Sidebar** nền green `#1F3D2B`: logo serif, label role (uppercase nhỏ), menu theo role, badge đỏ burgundy cho mục chờ xử lý (invitations, pending...), user info + logout dưới cùng. Collapse icon-only trên màn hình hẹp.
- **Header** mảnh: breadcrumb trái; chuông notification + số dư ví (pill green) phải.
- **Content area**: nền kem, page đổ nội dung vào.

Menu theo role:
- Owner: Overview, My Horses, Registrations, Invitations, Rankings, Wallet
- Jockey: Overview, Invitations, My Races, History, Rankings, Wallet
- Spectator: Overview, Tournaments, Live, Predictions, My Bets, Wallet
- Referee: Overview, Assigned Races, Inspections, Reports

### 2.2. PublicShell (Landing, Tournaments public, Auth)

Top-nav: nền kem có border-bottom green 2px, logo serif trái, menu + CTA phải. Không sidebar.

## 3. Shared components

Đặt tại `frontend/src/app/components/ui/`:

| Component | Mô tả |
|---|---|
| `AppShell` | Sidebar + header + content slot, nhận config menu theo role |
| `PublicShell` | Top-nav + content cho trang public |
| `PageHeader` | Title serif + subtitle + action slot bên phải |
| `StatCard` | Label uppercase + số lớn serif |
| `RaceCard` | Tên race + GradeBadge + StatusPill + meta (distance, purse, time, countdown) |
| `GradeBadge` | Maiden/G3/G2/G1 theo style mục 1.1 |
| `StatusPill` | Race status theo style mục 1.1 |
| `HorseCard`, `JockeyCard` | Profile ngắn: tên, grade/stats, ảnh |
| `WinProbBar` | Label + % + thanh progress (AI prediction) |
| `CoinAmount` | Format ₵ thống nhất (tabular-nums, gold cho earnings) |
| `EmptyState` | Icon + message + action khi danh sách rỗng |

## 4. Thứ tự migrate (7 đợt)

| Đợt | Nội dung |
|---|---|
| 0 | Foundation: theme.css mới, fonts (Playfair Display + Inter), AntD ConfigProvider token, toàn bộ shared components |
| 1 | PublicShell + LandingPage |
| 2 | AppShell + Auth (Login, Register, ForgotPassword) |
| 3 | Nhóm Spectator: TournamentsPage, RankingsPage, PredictionsPage, LiveRacePage, SpectatorDashboard |
| 4 | HorseOwnerDashboard — tách theo tab: Overview / Horses / Registrations / Invitations / Wallet |
| 5 | JockeyDashboard + RefereeDashboard |
| 6 | Phụ trợ: ProfilePage, DepositPortalPage, DepositHistoryPage, BetHistoryPage, NotFoundPage |

**Ngoài phạm vi:** trang Admin (`pages/admin/`), mobile app, backend.

## 5. Đảm bảo không vỡ chức năng

- Chỉ thay JSX/markup/class; không sửa hooks, query keys, store, socket handlers.
- File lớn (SpectatorDashboard ~100KB, HorseOwnerDashboard ~116KB) tách dần theo section vào thư mục con (vd `pages/owner/HorsesSection.tsx`); mỗi lần tách 1 section → chạy thử → commit. Không tách hết một lượt.
- Checklist test thủ công cho mỗi page trước khi sang page kế: các flow chính (đăng ký race, đặt cược, accept invitation, pre-check, live race) hoạt động như trước.
- Mỗi đợt commit gọn theo nhánh, có thể revert từng đợt độc lập.

## 6. Quyết định đã chốt trong brainstorm

1. Phạm vi: đại tu cả layout lẫn theme, tất cả pages trừ Admin.
2. Visual direction: Heritage Editorial Light (chọn C trong 3 phương án).
3. Layout dashboard: sidebar cố định (chọn B trong 3 phương án).
4. Cách làm: vừa redesign vừa tách component (không restyle tại chỗ, không viết lại từ đầu).
5. Chiến lược: foundation-first (Hướng 1) — xây design system + components trước, migrate page sau.
