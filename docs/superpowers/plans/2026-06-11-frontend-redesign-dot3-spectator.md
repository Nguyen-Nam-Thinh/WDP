# Frontend Redesign — Heritage Light Đợt 3 (Spectator Group) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate 5 trang nhóm Spectator (TournamentsPage, RankingsPage, PredictionsPage, LiveRacePage, SpectatorDashboard) + ProfileDropdown sang Heritage Light, dùng PublicShell/AppShell đã có từ Đợt 0.

**Architecture:** Các trang public (Tournaments, Rankings, Predictions) bỏ `Navbar` cũ (dark, fixed) → wrap bằng `PublicShell` (sticky, light). SpectatorDashboard wrap bằng `AppShell` (sidebar). LiveRacePage giữ khu vực track simulation tối như "sân khấu" nhưng chrome trang chuyển light. Mỗi trang: giữ nguyên 100% logic/API/socket, chỉ đổi class + shell.

**Tech Stack (THỰC TẾ):** React 18 + Vite 6 + Tailwind v4 (`@theme inline` đã remap palette ở Đợt 0) + MUI Button rải rác + Radix UI + react-router 7 + sonner. KHÔNG có Ant Design/TanStack/Zustand.

**Verification:** Không có test infra. Mỗi task verify bằng `npm run build --prefix frontend` (chạy từ repo root, phải PASS) + check trên dev server (`npm run dev` trong `frontend/`, mở trang tương ứng).

---

## Bảng class mapping (dùng cho MỌI task)

| Class cũ (dark idiom) | Thay bằng |
|---|---|
| `bg-slate-950`, `bg-[#1B0C0C]`, `bg-[#0a0a0a]`, `bg-black` | `bg-background` |
| `bg-slate-900`, `bg-[#241414]`, `bg-white/5`, `bg-slate-900/50` | `bg-card` |
| `text-white`, `text-slate-50`, `text-slate-200` | `text-foreground` |
| `text-slate-300/400/500` | `text-muted-foreground` |
| `text-[#FFDE42]`, `text-emerald-400` | `text-primary` (hoặc `text-gold` nếu là tiền/prize/điểm) |
| `bg-[#FFDE42] text-black` (button) | `bg-primary text-primary-foreground` |
| `border-white/5`, `border-white/10`, `border-slate-800` | `border-border` |
| `rounded-xl`, `rounded-2xl` (card/button) | bỏ hoặc giữ tuỳ chỗ — heritage ưu tiên góc vuông, KHÔNG bắt buộc đổi nếu đổi gây vỡ layout |
| gradient tối (`from-slate-950...`, `from-[#1B0C0C]...`) | nền phẳng `bg-background`, hoặc giữ gradient TỐI chỉ khi đè trên ảnh/video để chữ trắng đọc được |
| `hover:bg-white/10` | `hover:bg-muted` |
| heading section lớn | thêm `font-serif` |
| badge LIVE đỏ `bg-red-500` | `bg-secondary` |
| `bg-emerald-500` (badge TRỰC TIẾP) | `bg-primary text-primary-foreground` |
| MUI Button sx gradient vàng | sx phẳng: `background:'#1F3D2B', color:'#F7F3EA', borderRadius:0, boxShadow:'none'`, hover `background:'#172D20'` |

Hex hardcode (`#FFDE42`, `#1B0C0C`, `#0a0a0a`...) KHÔNG được palette remap phủ — phải thay thủ công từng chỗ. Sau khi sửa xong mỗi file, search lại trong file: `FFDE42`, `1B0C0C`, `0a0a0a`, `slate-9` — phải về 0 kết quả (trừ khi cố ý giữ gradient trên ảnh, dùng `#23201A` thay vì slate).

Grade badge tự viết trong page → thay bằng `<GradeBadge grade={...}/>` từ `components/shared/GradeBadge`. Status pill tự viết → `<StatusPill status={...}/>`. Thanh % AI → cân nhắc `WinProbBar`. KHÔNG ép dùng nếu markup hiện tại có thêm thông tin không khớp props — khi đó chỉ đổi màu theo mapping.

### Quy trình chung cho mỗi page-task (lặp lại trong từng task)

1. Đọc TOÀN BỘ file trước khi sửa, ghi nhận: shell/nav đang dùng, chỗ gọi API/socket, animation.
2. Sửa theo mapping, giữ nguyên logic.
3. `npm run build --prefix frontend` → PASS.
4. Mở trang trên dev server, check: nền sáng, không chữ trắng trên nền sáng, action hoạt động.
5. Commit.

---

### Task 0: Baseline

**Files:** không sửa.

- [ ] **Step 1: Build sạch**

Run: `npm run build --prefix frontend`
Expected: PASS. Nếu fail → dừng, báo user.

### Task 1: ProfileDropdown — restyle light

**Files:**
- Modify: `frontend/src/app/components/ProfileDropdown.tsx` (~13 chỗ màu dark hardcode)

ProfileDropdown được dùng bởi PublicShell (đã light) và các dashboard — phải light trước khi các page dùng nó.

- [ ] **Step 1: Đọc toàn bộ file, áp mapping**

Dropdown panel: `bg-card border border-border` thay cho nền tối; item hover `hover:bg-muted`; text `text-foreground`/`text-muted-foreground`; accent `text-primary`; mọi `#FFDE42`/`slate-9xx`/`white/...` thay theo bảng. Avatar/initials badge: `bg-primary text-primary-foreground`.

- [ ] **Step 2: Build + verify**

Run: `npm run build --prefix frontend` → PASS. Dev server: mở `/` khi đã đăng nhập (hoặc kiểm bằng mắt markup) — dropdown nền trắng, chữ đậm.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/components/ProfileDropdown.tsx
git commit -m "feat: restyle profile dropdown for heritage light"
```

### Task 2: TournamentsPage

**Files:**
- Modify: `frontend/src/app/pages/TournamentsPage.tsx` (~20KB)

- [ ] **Step 1: Đọc toàn bộ file**
- [ ] **Step 2: Thay `<Navbar/>` bằng wrap `<PublicShell>...</PublicShell>`**, xoá import Navbar, xoá padding-top bù cho fixed nav (PublicShell sticky, không cần `pt-[72px]`).
- [ ] **Step 3: Áp class mapping toàn trang.** Card tournament/race: `bg-card border border-border`. Badge grade → `GradeBadge`. Status → `StatusPill` nếu khớp, không thì đổi màu tay. Fix lỗi smoke test Đợt 2: badge "Tất Cả" (filter active) chữ trắng — đổi thành `bg-primary text-primary-foreground`.
- [ ] **Step 4: Build + verify trên dev server** (`/tournaments`): nền kem, card trắng, filter hoạt động, không còn `FFDE42|1B0C0C|0a0a0a|slate-9` trong file.
- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/TournamentsPage.tsx
git commit -m "feat: migrate tournaments page to heritage light"
```

### Task 3: RankingsPage

**Files:**
- Modify: `frontend/src/app/pages/RankingsPage.tsx` (~17KB)

- [ ] **Step 1: Đọc toàn bộ file**
- [ ] **Step 2: Navbar → PublicShell** (như Task 2 Step 2).
- [ ] **Step 3: Áp mapping.** Fix lỗi smoke test: header "Bảng Xếp Hạng" chữ trắng trên nền tím mờ → `font-serif text-foreground`, bỏ nền tím; icon "?" trắng trên `#EDE7D8` → `text-muted-foreground`; badge rank "3" trên nền đỏ mờ → dùng RANK style: hạng 1 `bg-gold text-foreground`, hạng 2 `bg-[#9A937F] text-white`, hạng 3 `bg-[#A85C32] text-white`, còn lại `bg-primary text-primary-foreground`. Bảng xếp hạng: header row `text-[10px] uppercase tracking-wider text-muted-foreground`, số dùng `tabular-nums`.
- [ ] **Step 4: Build + verify** (`/rankings`): không còn chữ trắng trên nền sáng (kiểm bằng mắt cả tab horse lẫn jockey nếu có).
- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/RankingsPage.tsx
git commit -m "feat: migrate rankings page to heritage light"
```

### Task 4: PredictionsPage

**Files:**
- Modify: `frontend/src/app/pages/PredictionsPage.tsx` (~69KB — đọc theo phần, sửa theo phần, nhưng PHẢI phủ hết file)
- Có thể modify: `frontend/src/app/components/predictions/*` nếu page import component con dark

- [ ] **Step 1: Đọc toàn bộ file (chia 2-3 lần đọc), liệt kê các section + component con import từ `components/predictions/`**
- [ ] **Step 2: Navbar → PublicShell**, bỏ padding bù.
- [ ] **Step 3: Áp mapping từng section.** Thanh xác suất AI: nền `bg-muted`, fill `bg-primary`, % `font-serif font-bold`. Card dự đoán: `bg-card border border-border`. Nếu có chart/visualization màu vàng neon → đổi sang `#1F3D2B`/`#8C2F1B`/`#C9A227`.
- [ ] **Step 4: Sửa luôn các component con trong `components/predictions/` nếu chúng có màu dark hardcode** (đọc từng file con được import).
- [ ] **Step 5: Build + verify** (`/predictions`): toàn trang sáng, prediction bar hiển thị đúng.
- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/PredictionsPage.tsx frontend/src/app/components/predictions/
git commit -m "feat: migrate predictions page to heritage light"
```

### Task 5: LiveRacePage

**Files:**
- Modify: `frontend/src/app/pages/LiveRacePage.tsx` (~38KB)
- Có thể modify: `frontend/src/app/components/RaceTrack.tsx` (chỉ nếu vỡ tương phản nặng)

**Nguyên tắc riêng:** khu vực render track/simulation (RaceTrack, canvas, leaderboard live đè trên track) được phép GIỮ NỀN TỐI như một "sân khấu" — nhưng dùng `#23201A`/`#1F3D2B` thay vì `#1B0C0C`/slate-950. Chrome xung quanh (header trang, panel thông tin race, danh sách bet, kết quả) chuyển light theo mapping.

- [ ] **Step 1: Đọc toàn bộ file**, xác định ranh giới "sân khấu track" vs chrome trang. Ghi nhận socket handlers (GIỮ NGUYÊN).
- [ ] **Step 2: Root `bg-gradient-to-br from-[#1B0C0C] via-slate-950 to-slate-900` (cả loading state dòng ~417 lẫn main dòng ~424) → `bg-background text-foreground`.**
- [ ] **Step 3: Áp mapping cho chrome; khu track giữ tối nhưng đổi hex sang `#23201A`/xanh đậm.** Badge LIVE → `bg-secondary`. Tên ngựa/jockey trên panel light: `text-foreground`.
- [ ] **Step 4: Build + verify** (`/live-race/...` — nếu cần race đang chạy thì verify tối thiểu: trang load không trắng chữ, layout không vỡ ở trạng thái loading/empty).
- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/LiveRacePage.tsx frontend/src/app/components/RaceTrack.tsx
git commit -m "feat: migrate live race page to heritage light"
```

### Task 6: SpectatorDashboard + AppShell

**Files:**
- Modify: `frontend/src/app/pages/SpectatorDashboard.tsx` (~100KB — file lớn nhất, đọc theo phần, phủ hết)

- [ ] **Step 1: Đọc toàn bộ file (nhiều lần đọc), liệt kê: tab/section, header tự chế, chỗ gọi API, modal đặt cược.**
- [ ] **Step 2: Wrap bằng `AppShell`** với nav spectator:

```tsx
import { AppShell } from '../components/layout/AppShell';
import { Home, Trophy, TrendingUp, Ticket, Wallet, Medal } from 'lucide-react';

const SPECTATOR_NAV = [
  { to: '/spectator', label: 'Tổng Quan', icon: <Home /> },
  { to: '/tournaments', label: 'Giải Đấu', icon: <Trophy /> },
  { to: '/predictions', label: 'Dự Đoán', icon: <TrendingUp /> },
  { to: '/bet-history', label: 'Lịch Sử Cược', icon: <Ticket /> },
  { to: '/rankings', label: 'Xếp Hạng', icon: <Medal /> },
  { to: '/deposit', label: 'Ví Của Tôi', icon: <Wallet /> },
];
// wrap: <AppShell roleLabel="SPECTATOR" nav={SPECTATOR_NAV}>...</AppShell>
```

LƯU Ý: đọc route paths thật trong `App.tsx`/router trước — nếu path khác (vd `/deposit-history`), sửa `to` theo path thật. Nếu dashboard hiện điều hướng bằng tab state nội bộ (không phải route), GIỮ tab nội bộ, nav sidebar chỉ trỏ các route có thật; không refactor tab → route trong đợt này.

- [ ] **Step 3: Xoá header/nav tự chế trong page** (ProfileDropdown đã có trong AppShell? — KHÔNG, AppShell hiện chỉ có Bell + ví; nếu page đang dùng ProfileDropdown thì giữ nó trong header content hoặc bỏ vì sidebar đã có user + logout).
- [ ] **Step 4: Áp mapping toàn bộ section** (stat cards → cân nhắc `StatCard`, race cards → `RaceCard` nếu khớp props, không thì đổi màu tay). Modal đặt cược: `bg-card border border-border`, nút Đặt Cược `bg-secondary text-secondary-foreground`.
- [ ] **Step 5: Build + verify** (`/spectator` cần đăng nhập — nếu không có account test, verify tối thiểu bằng build PASS + đọc lại diff; báo user check phần đăng nhập).
- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/SpectatorDashboard.tsx
git commit -m "feat: migrate spectator dashboard to heritage light with AppShell"
```

### Task 7: Dọn Navbar cũ + checkpoint

- [ ] **Step 1: Kiểm tra Navbar.tsx còn ai import không**

Run: `grep -r "components/Navbar" frontend/src` (hoặc Grep tool)
Nếu 0 kết quả → xoá `frontend/src/app/components/Navbar.tsx`. Nếu còn (vd BetHistoryPage, DepositPortalPage — thuộc Đợt 6) → GIỮ NGUYÊN file, ghi chú lại.

- [ ] **Step 2: Build + smoke test**: `/`, `/tournaments`, `/rankings`, `/predictions` — đi lại bằng mắt, không còn mảng tối sót/chữ trắng trên nền sáng.

- [ ] **Step 3: Commit (nếu có xoá file) + báo cáo user**

```bash
git add -A
git commit -m "chore: remove unused dark navbar after spectator migration"
```

Báo user kết quả + đề xuất plan Đợt 4 (Owner) sau khi user xác nhận.

---

## Ngoài phạm vi
- BetHistoryPage, DepositPortalPage, DepositHistoryPage, ProfilePage (Đợt 6 — trang phụ trợ).
- HorseOwnerDashboard (Đợt 4), JockeyDashboard + RefereeDashboard (Đợt 5).
- Refactor tab-state → route trong SpectatorDashboard.
