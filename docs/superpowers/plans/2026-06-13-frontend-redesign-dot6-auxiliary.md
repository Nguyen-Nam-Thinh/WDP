# Frontend Redesign — Heritage Light Đợt 6 (Auxiliary Pages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate 5 trang phụ trợ cuối sang Heritage Light, giữ nguyên 100% logic: BetHistoryPage (236 dòng), DepositHistoryPage (234), DepositPortalPage (507), ProfilePage (1002), NotFoundPage (270).

**Architecture:** Đây là ĐỢT CUỐI. Các trang này là sub-page (BetHistory/DepositHistory/DepositPortal/Profile dưới `/spectator/*` với nav "Quay Lại" về `/spectator`; NotFound là catch-all). KHÔNG nhồi AppShell — giữ nav back-button hiện có, chỉ restyle sang light (nền `bg-background`, nav `bg-background/95 border-b border-border`, chữ `text-foreground`). Dùng cùng công thức replace-all đã chạy ở Đợt 4–5.

**Bảng hex swap (giống Đợt 4–5):** `#FFDE42`→`#C9A227` · `#E6C21E`→`#B08D1E` · `to-[#1B0C0C]`→`#8F7318`, `#1B0C0C`→`#23201A` · `#10b981`→`#1F3D2B` · `#059669`→`#172D20` · `#f59e0b`→`#C9A227` · `#ef4444`/`#f87171`→`#B42318` · `#94a3b8`/`#64748b`→`#7A7468` · `#fbbf24`→`#8F7318` · `#0f172a` Dialog bg→`#FFFFFF` · `rgba(255,255,255,0.05–0.1)` border→`#E3DCCB`, hover bg→`rgba(35,32,26,0.04)`. Idiom: `bg-slate-950`→`bg-background`, `bg-slate-950/8|9x`→`bg-background/95`, `bg-white/x`→`bg-card`/`bg-muted/40`, `border-white/x`→`border-border`, `hover:bg-white/x`→`hover:bg-muted`, `text-white`→`text-foreground` TRỪ trên nền màu đậm (icon trên gradient, badge solid), heading `text-N font-bold text-white`→thêm `font-serif`, `text-slate-400/500/600`→`text-muted-foreground`.

**Status/accent màu phụ** (badge bet status, deposit method): map sang heritage — won/success→primary green, lost/error→`#B42318` burgundy-red, pending→muted, info/blue→secondary hoặc primary. Đọc ngữ cảnh từng chỗ statusConfig.

**Verification:** `npm run build --prefix frontend` PASS sau mỗi task. NotFoundPage verify được trên dev server (public route `/xyz`); 4 trang còn lại sau đăng nhập spectator → build + đọc diff, báo user.

---

### Task 1: BetHistoryPage
- [ ] Hex swap + idiom + nav light + serif heading. statusConfig: won→`#1F3D2B`/green-bg, lost→`#B42318`, pending→muted, blue bet-type badge→primary.
- [ ] Build PASS, commit `feat: migrate bet history page to heritage light`

### Task 2: DepositHistoryPage
- [ ] Hex swap + idiom + nav light + serif. Status success→primary, processing→gold, failed→`#B42318`.
- [ ] Build PASS, commit `feat: migrate deposit history page to heritage light`

### Task 3: DepositPortalPage
- [ ] Hex swap + idiom + nav light + serif. 3-step deposit flow (method/amount/confirm) — restyle method cards + inputs light.
- [ ] Build PASS, commit `feat: migrate deposit portal page to heritage light`

### Task 4: ProfilePage (lớn nhất)
- [ ] Đọc theo chunk. Hex swap + idiom + nav light + serif + bất kỳ Dialog/form light.
- [ ] Build PASS, commit `feat: migrate profile page to heritage light`

### Task 5: NotFoundPage
- [ ] Hex swap (`#f59e0b`→`#C9A227`) + idiom light. Verify trên dev server `/xyz`.
- [ ] Build PASS, commit `feat: migrate not found page to heritage light`

### Task 6: Checkpoint cuối
- [ ] Smoke test toàn site (public routes), grep toàn `frontend/src/app/pages` còn sót `FFDE42|1B0C0C|bg-slate-950` → 0. Báo cáo hoàn tất redesign Đợt 0–6.
