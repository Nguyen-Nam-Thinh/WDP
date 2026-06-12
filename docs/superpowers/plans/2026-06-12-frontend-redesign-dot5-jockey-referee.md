# Frontend Redesign — Heritage Light Đợt 5 (Jockey + Referee) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate JockeyDashboard (~47KB) và RefereeDashboard (~41KB) sang Heritage Light với AppShell, giữ nguyên 100% logic (invitation accept/reject, pre-check inspection, confirm result, report).

**Architecture:** Cùng công thức đã chạy thành công ở Đợt 4 (HorseOwnerDashboard, plan `2026-06-12-frontend-redesign-dot4-owner.md`): (1) hex swap replace-all, (2) thay nav fixed tự chế bằng AppShell, (3) white-idiom theo ngữ cảnh + dialog Paper light + heading serif. Palette remap theme.css đã xử lý sẵn slate/amber/purple/emerald.

**Bảng hex swap (giống Đợt 4):** `#FFDE42`→`#C9A227` · `#E6C21E`→`#B08D1E` · `to-[#1B0C0C]`/`#1B0C0C 100%`→`#8F7318` (trong gradient với gold), còn lại `#1B0C0C`→`#23201A` · `#10b981`→`#1F3D2B` · `#059669`→`#172D20` · `#f59e0b`→`#C9A227` · `#ef4444`→`#B42318` · `#94a3b8`/`#64748b`→`#7A7468` · `#0f172a` (Dialog bg)→`#FFFFFF`, (text trên gold)→`#23201A` · `rgba(255,255,255,0.05–0.3)` border→`#E3DCCB`/`#C9C2B0`, bg→`rgba(35,32,26,0.04–0.06)` · `bg-white/x`→`bg-card`/`bg-muted/40` · `border-white/x`→`border-border` · `text-white`→`text-foreground` TRỪ trên nền màu đậm (icon trên gradient, badge solid, avatar gradient) · heading `text-N font-bold text-white`→thêm `font-serif`.

**Verification:** `npm run build --prefix frontend` PASS sau mỗi task. Không có account jockey/referee trong preview → verify bằng build + đọc diff, báo user check sau đăng nhập.

---

### Task 1: JockeyDashboard
**Files:** Modify `frontend/src/app/pages/JockeyDashboard.tsx`
- [ ] Hex swap theo bảng (đọc ngữ cảnh 3 chỗ `#1B0C0C`, 1 chỗ `#0f172a` trước khi thay).
- [ ] Đọc vùng nav fixed → thay bằng `<AppShell roleLabel="JOCKEY" nav={JOCKEY_NAV}>`; JOCKEY_NAV: `/jockey` (Tổng Quan/Home), `/tournaments` (Trophy), `/rankings` (Medal). Xoá ProfileDropdown/Menu/X, bỏ `pt-24`.
- [ ] White-idiom + text-white theo ngữ cảnh + serif heading + Dialog light (1 PaperProps).
- [ ] Build PASS, commit `feat: migrate jockey dashboard to heritage light`

### Task 2: RefereeDashboard
**Files:** Modify `frontend/src/app/pages/RefereeDashboard.tsx`
- [ ] Hex swap theo bảng (4 chỗ `#1B0C0C`, 3 chỗ `#0f172a` đọc ngữ cảnh).
- [ ] AppShell `roleLabel="REFEREE"`, REFEREE_NAV: `/referee` (Tổng Quan/Home), `/tournaments` (Trophy), `/rankings` (Medal).
- [ ] White-idiom + serif + 3 Dialog light.
- [ ] Build PASS, commit `feat: migrate referee dashboard to heritage light`

### Task 3: Checkpoint
- [ ] Smoke test build + báo user check 2 dashboard sau đăng nhập; đề xuất Đợt 6 (BetHistory, DepositPortal, DepositHistory, Profile, NotFound).
