# Frontend Redesign — Heritage Light Đợt 4 (Horse Owner) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate HorseOwnerDashboard (~115KB, ~2400 dòng) sang Heritage Light với AppShell sidebar, giữ nguyên 100% logic (horse CRUD, invitation, registration, wallet, 7 dialogs).

**Architecture:** File quá lớn để rewrite một lần. Chiến lược: (1) hex/idiom swap bằng replace-all an toàn — palette remap của theme.css đã xử lý sẵn slate/amber/purple/emerald; (2) thay nav tự chế bằng AppShell; (3) đọc từng phần để sửa `text-white` theo ngữ cảnh (giữ trắng trên nền màu đậm, đổi `text-foreground` trên nền sáng) + restyle MUI sx.

**Tech Stack:** React 18 + Tailwind v4 remap + MUI Dialog/Button + AppShell/GradeBadge/StatusPill đã có từ Đợt 0.

**Verification:** `npm run build --prefix frontend` PASS sau mỗi task + check `/horse-owner` trên dev server (cần đăng nhập owner — nếu không có account, verify bằng build + đọc diff, báo user check).

---

### Task 0: Baseline
- [ ] Build PASS trước khi sửa.

### Task 1: Hex swap an toàn (replace-all trong file)
- [ ] `#FFDE42` → `#C9A227`; `#E6C21E` → `#B08D1E`; `#FFE866`/`#FFE862` → `#D9B53C` (nếu có)
- [ ] Kiểm tra 6 chỗ `#1B0C0C` riêng lẻ: nếu là màu CHỮ trên nền vàng → `#23201A`; nếu là NỀN tối → `bg-background`/bỏ gradient.
- [ ] sx MUI: `#10b981`→`#1F3D2B`, `#ef4444`→`#8C2F1B`, `#f59e0b`→`#C9A227` (đọc ngữ cảnh từng chỗ).
- [ ] Build PASS, commit `feat: swap owner dashboard hardcoded hex to heritage palette`

### Task 2: AppShell + bỏ nav tự chế
- [ ] OWNER_NAV: `/horse-owner` (Tổng Quan/Home), `/tournaments` (Trophy), `/rankings` (Medal) — chỉ route có thật; tab nội bộ giữ nguyên.
- [ ] Xoá `<nav>` fixed (dòng ~527), wrap return bằng `<AppShell roleLabel="HORSE OWNER" nav={OWNER_NAV}>`, bỏ `pt-24`, xoá import ProfileDropdown/Menu/X nếu không còn dùng.
- [ ] Build PASS, commit `feat: wrap horse owner dashboard in heritage AppShell`

### Task 3: Quét white-idiom theo ngữ cảnh
- [ ] replace-all: `border-white/5|8|10|20` → `border-border`; `bg-white/3|4|5|8|10` → `bg-muted/40`; `hover:bg-white/5|10` → `hover:bg-muted`; `divide-white/5` → `divide-border`.
- [ ] Đọc toàn file theo chunk, sửa từng `text-white`: trên nền sáng → `text-foreground`; trên nền màu đậm (badge/chip/button màu) → GIỮ.
- [ ] Dialog PaperProps nền tối → trắng `#FFFFFF` border `#E3DCCB`; input/select sx light (mẫu lightSelectSx như SpectatorDashboard).
- [ ] Heading section thêm `font-serif`.
- [ ] Build PASS + verify dev server, commit `feat: migrate horse owner dashboard to heritage light`

### Task 4: Checkpoint
- [ ] Smoke test `/horse-owner` (cần account owner — nếu thiếu thì báo user), báo cáo, đề xuất Đợt 5.
