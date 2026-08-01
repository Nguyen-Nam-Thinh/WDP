# Hướng dẫn vòng đời: Tournament → Race → Kết thúc & chia tiền

> File đọc nhanh cho team. Giải thích **ai làm gì, khi nào**, từ lúc Admin tạo giải đến lúc đã trao thưởng và biên bản Official.

---

## Nhìn tổng quan (1 phút)

```
Admin tạo Tournament
        ↓
Admin tạo Race (gắn Referee)
        ↓
Race = open  →  Owner đăng ký ngựa (+ Jockey)
        ↓
Cutoff đăng ký → closed
        ↓
pre_check → Referee kiểm tra ngựa (Pass / Fail)
        ↓
Đủ điều kiện → stewardsReady + auto draft Pre-race Report
        ↓
Tới giờ đua → running + Spectator cược (trước cutoff 1h)
        ↓
Referee Live Flag trong lúc đua
        ↓
finished → kết quả TẠM (chưa purse, chưa settle bet, chưa cộng points)
        ↓
Referee: xác nhận kết quả + resolve (DQ đổi hạng ngay; Fine → phiếu nợ)
        ↓
Nộp báo cáo → Admin duyệt → PHÁT TIỀN + settle bet + isOfficial + BXH chính thức
```

**Lưu ý quan trọng**

| Khái niệm | Ý nghĩa |
|-----------|---------|
| `race.status` | Trạng thái máy (open → … → finished). **Không** đổi thành Ready/Official. |
| `stewardsReady` | Pre-check xong (mọi ngựa đã pass/fail). Auto tạo draft Pre-race Report. |
| `resultsConfirmedAt` | Referee đã xác nhận bảng kết quả sau đua. |
| `isOfficial` / `payoutSettledAt` | Admin đã duyệt biên bản **và** đã phát purse + settle cược. |
| Chia tiền / settle bet | **Chỉ** khi Admin **approve** report — **không** lúc `finished`. |
| Kết quả sau `finished` | **Tạm thời** cho đến khi Official. |

---

## Bước 1 — Admin tạo Tournament

**Ai:** Admin  
**Làm gì:** Tạo giải đấu (tên, thời gian, mô tả…).

**Kết quả:** Có 1 tournament để gắn nhiều race vào.

---

## Bước 2 — Admin tạo Race

**Ai:** Admin  
**Làm gì:** Trong tournament, tạo cuộc đua với các thông tin chính:

- Tên, grade (Maiden / G3 / G2 / G1)
- `maxCapacity`, `purse` (tổng giải thưởng), `registrationFee`
- `scheduledTime` (giờ đua), `cutoffTime` (hết hạn đăng ký, thường 48–72h trước giờ đua)
- `distance`, điều kiện tham gia (grade / điểm / tuổi…)
- **Phân công Referee** (`refereeId`)

**Trạng thái ban đầu:** `open`  
**Cờ phụ:** `stewardsReady = false`, `isOfficial = false`

---

## Bước 3 — Owner chuẩn bị & đăng ký

**Ai:** Owner (và Jockey)

1. Owner tạo / quản lý ngựa.
2. (Tuỳ chọn) Mời jockey → jockey Accept.
3. Khi race `open` và còn trước `cutoffTime`:
   - Owner chọn ngựa + jockey
   - Trả `registrationFee` từ wallet
   - Tạo bản ghi **Registration** (`status: active`, pre-check `pending`)

**Quy tắc nhớ:**

- 1 jockey chỉ cưỡi **1 ngựa / 1 race**.
- Owner hủy đăng ký tự nguyện → hoàn **40%** phí.

---

## Bước 4 — Đóng đăng ký (`closed`)

**Khi nào:** Qua `cutoffTime` (cron / hệ thống).

**Trạng thái:** `open` → `closed`  
Không nhận thêm đăng ký.

---

## Bước 5 — Pre-check (`pre_check`)

**Khi nào:** Hệ thống chuyển race sang `pre_check` (theo lịch / job).  
**Ai:** Referee được phân công.

### 5.1 Referee kiểm tra từng ngựa

Với mỗi registration còn `active` — UI chỉ còn **Đạt / Không Đạt** (không còn checklist 4 mục):

| Kết quả | Việc xảy ra |
|---------|-------------|
| **Đạt** | Gọi API ngay, không popup. `preCheckResult.status = passed` |
| **Không Đạt** | Modal: **Category** (bắt buộc) + **Note** (tuỳ chọn) → confirm. Registration → `disqualified`. Owner hoàn **70%** phí. Spectator bet trên ngựa đó hoàn **100%**. Ghi **Late Scratching** vào Pre-race Stewards’ Report |

Đổi nài / gear nhỏ → ghi ở **Báo cáo nháp** (Rider Changes / Gear Changes), không ghi ở pre-check.

Fail là **một chiều** (không undo Pass lại trong phase hiện tại).

### 5.2 Stewards Ready

Khi **mọi** registration đã có pre-check (passed hoặc failed):

→ `stewardsReady = true`  
(Status race vẫn là `pre_check` hoặc bước kế tiếp — **không** đổi tên status thành “Ready”.)

### 5.3 Biên bản Pre-race (có thể làm dần)

Referee mở / tạo **Referee Report** (draft), điền 5 mục Pre-race:

1. Track Condition (+ note)  
2. Late Scratchings (tự sinh khi Fail; trống = “Nil”)  
3. Rider Changes  
4. Gear Changes  
5. Vet Checks  

Nộp báo cáo **không bắt buộc** ngay lúc này — có thể hoàn thiện sau đua (theo thiết kế flexible).

---

## Bước 6 — Betting (Spectator)

**Ai:** Spectator  
**Khi:** Race chưa qua betting cutoff (**1 giờ trước** `scheduledTime`).

- Đặt Win / Place / Show  
- Multiplier **khóa** lúc đặt  
- Trừ coin ví → transaction `bet_placed`

Race cancel → hoàn 100% bet. Bet thua → 0%.

---

## Bước 7 — Race chạy (`running`)

**Khi nào:** Tới `scheduledTime` (cron ~30s check) → `running`.  
Simulation (AI / engine) chạy realtime qua Socket.IO.

### 7.1 Live Flag (Referee)

Trong lúc `running`, Referee vào **Live Flag**:

- Bấm **Flag** từng ngựa — **không gõ mô tả**
- Tạo incident `source: live_flag`, `status: draft`
- Sau đua mới Resolve (xem Bước 9)

Auto-collision (máy tự flag) = **không làm** (out of scope).

---

## Bước 8 — Kết thúc đua (`finished`) — kết quả TẠM

**Khi nào:** Simulation xong → `status = finished`.

Hệ thống **chỉ**:

### 8.1 Lưu kết quả tạm

Tạo `race_results`: `position`, `provisionalPosition`, `finishTime`, `prizeAmount = 0`, `pointsEarned = 0`.

### 8.2 Chưa làm lúc này

- Không chia purse  
- Không cộng points / earnings / grade  
- Không settle bet  

UI / thông báo: **Kết quả tạm thời, chờ steward/admin**.

---

## Bước 9 — Referee sau đua

### 9.1 Xác nhận kết quả

Tab **Kết Quả** → **Xác nhận kết quả** (`resultsConfirmedAt`).

### 9.2 Resolve Live Flag / incident

| Verdict | Hiệu lực |
|---------|----------|
| none / warning | Chỉ ghi biên bản |
| **disqualified** | Đổi hạng **ngay** trên `race_results` (dồn hạng); chưa trả tiền |
| **fine** | Tạo **PenaltyTicket**; chọn Owner hoặc Jockey; họ tự **Nộp phạt** từ ví |

### 9.3–9.4 Pre-race report + nộp

Track Condition bắt buộc → Submit → `pending_approval`.

---

## Bước 10 — Admin duyệt = phát tiền + Official

| Hành động | Kết quả |
|-----------|---------|
| **Approve** | Report `approved` + `isOfficial` + `payoutSettledAt` + **chia purse** + **points/grade** + **settle bet** (theo hạng sau DQ) |
| **Reject** | Có lý do → Referee sửa / nộp lại |

Approve lần 2 không trả tiền trùng (idempotent).

---

## Race bị hủy (`cancelled`)

**Ai:** Admin  
Owner: hoàn **100%** phí đăng ký.  
Spectator: hoàn **100%** bet.

---

## Ai làm gì — bảng nhanh

| Bước | Admin | Owner | Jockey | Referee | Spectator |
|------|:-----:|:-----:|:------:|:-------:|:---------:|
| Tạo tournament / race | ✅ | | | | |
| Phân công referee | ✅ | | | | |
| Đăng ký ngựa | | ✅ | (accept mời) | | |
| Pre-check Pass/Fail | | | | ✅ | |
| Đặt cược | | | | | ✅ |
| Live Flag | | | | ✅ | |
| Simulation + chia tiền | *(hệ thống)* | nhận thưởng | | | nhận/thua bet |
| Confirm kết quả | | | | ✅ | |
| Resolve flag + nộp report | | | | ✅ | |
| Duyệt Official | ✅ | | | | |

---

## Checklist demo nhanh

1. [ ] Admin: tạo Tournament + Race + chọn Referee  
2. [ ] Owner: đăng ký ≥ vài ngựa (có jockey)  
3. [ ] Đợi / force status → `pre_check`  
4. [ ] Referee: Pass hầu hết; Fail 1 con (có Category) → thấy Late Scratching  
5. [ ] Spectator: đặt vài bet trước cutoff  
6. [ ] Race `running` → Referee Flag 1–2 ngựa  
7. [ ] `finished` → kết quả tạm, ví **không** đổi, bet vẫn pending  
8. [ ] Referee: Confirm → Resolve DQ/Fine → Nộp báo cáo  
9. [ ] Admin: Approve → ví nhận purse, bet settle, Official  
10. [ ] User nộp PenaltyTicket từ Ví (nếu có Fine)

---

## File liên quan (chi tiết kỹ thuật)

- Business rules gốc: `CLAUDE.md` §4  
- Pre-race Stewards’ Report: `docs/superpowers/specs/2026-07-31-pre-race-stewards-report-design.md`  
- Full steward flow (Fail category → Approve → Flag → Confirm): `docs/superpowers/specs/2026-08-01-referee-steward-flow-design.md`

---

**Cập nhật:** 2026-08-01 — kèm steward flow Slice 1–4  
**Dành cho:** Group G07 — đọc onboarding / demo
