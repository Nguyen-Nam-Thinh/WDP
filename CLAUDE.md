# CLAUDE.md — Horse Racing Tournament Management System

> **Mục đích**: File này tổng hợp toàn bộ context của project. Dùng để AI/coding tool (Claude, Cursor, Copilot...) hiểu project khi sinh code. Đặt ở root của repo.

---

## 1. PROJECT OVERVIEW

### 1.1. Tên project
- **EN**: AI-Integrated Horse Racing Tournament Management System with Win Probability Prediction, Race Simulation, and Personalized Recommendation
- **VN**: Hệ thống quản lý giải đua ngựa tích hợp AI dự đoán xác suất chiến thắng, mô phỏng cuộc đua và gợi ý cá nhân hóa
- **Tên rút gọn**: HRTMS-AI

### 1.2. Loại project
- **Đồ án môn học** (capstone), không phải production
- **Team**: 4 người
- **Deadline**: 8 tuần
- **Class**: SE1823 — Group G07
- **Leader**: Nguyen Nam Thinh
- **Members**: Nguyen Duc Anh, Nguyen Hoai An, Nguyen Thanh Phong

### 1.3. Vấn đề giải quyết
Quản lý giải đua ngựa hiện còn thủ công, thiếu đồng bộ. Hệ thống số hóa toàn bộ vòng đời tournament + tích hợp AI để dự đoán/mô phỏng/gợi ý cho 5 nhóm user.

### 1.4. Quy mô dự kiến
- ~1,000 user concurrent
- Phân bổ: ~50 Owner, ~30 Jockey, ~5 Referee, ~900 Spectator, ~3 Admin

---

## 2. TECH STACK

### 2.1. Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Real-time**: Socket.IO
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Scheduled jobs**: node-cron (race auto-start, cutoff)
- **PDF export**: PDFKit hoặc puppeteer (cho Referee Report)
- **Validation**: Joi hoặc Zod
- **File upload**: Multer + Cloudinary

### 2.2. Frontend Web
- **Framework**: React + Vite + TypeScript
- **UI**: Tailwind CSS + Ant Design (Ant Design cho admin tables/forms phức tạp, Tailwind cho layout)
- **Routing**: React Router v6
- **Server state**: TanStack Query (React Query)
- **Client state**: Zustand
- **Real-time**: Socket.IO Client
- **Charts**: Recharts hoặc Ant Design Charts
- **Forms**: React Hook Form + Zod

### 2.3. Mobile (Spectator only)
- **Framework**: React Native + Expo
- **Target**: Android (1 nền tảng để giảm scope)
- **Role**: chỉ phục vụ Spectator (xem race + đặt cược + ví)

### 2.4. AI Service (Python microservice)
- **Framework**: FastAPI
- **Libraries**: scikit-learn, XGBoost, LightGBM, surprise, pandas, numpy
- **Communication**: Node BE gọi qua REST API (HTTP)
- **Model serving**: joblib `.pkl` files

### 2.5. Payment
- **Stripe Test Mode** (sandbox) — không dùng tiền thật

### 2.6. DevOps & Deploy
- **Container**: Docker + docker-compose
- **Backend**: Railway / Render (free tier)
- **Frontend**: Vercel
- **MongoDB**: MongoDB Atlas (free 512MB)
- **CI**: GitHub Actions (lint + test)
- **Code quality**: ESLint + Prettier + Husky + lint-staged

### 2.7. API Docs
- **Swagger** (swagger-jsdoc)

---

## 3. ARCHITECTURE

```
┌─────────────────┐     ┌──────────────────┐
│  React Web App  │     │ React Native App │
│   (5 roles)     │     │  (Spectator only)│
└────────┬────────┘     └────────┬─────────┘
         │  HTTP / WebSocket     │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │  Node.js Backend      │
         │  Express + Socket.IO  │
         │  JWT Auth + Mongoose  │
         └───┬───────────┬───────┘
             │           │
   ┌─────────▼─┐    ┌────▼─────────┐
   │ MongoDB   │    │ Python AI    │
   │ Atlas     │    │ Service      │
   └───────────┘    │ (FastAPI)    │
                    │ XGBoost/LGBM │
                    └──────────────┘
                            │
                    ┌───────▼──────┐
                    │ Stripe Test  │
                    │ (sandbox)    │
                    └──────────────┘
```

---

## 4. BUSINESS RULES (CRITICAL — KHÔNG ĐƯỢC THAY ĐỔI)

### 4.1. Roles
5 roles, role-based access control:
- `owner` — Horse Owner: sở hữu ngựa, đăng ký race, thuê jockey
- `jockey` — Jockey: nhận invitation, cưỡi ngựa
- `referee` — Race Referee: kiểm tra ngựa, confirm result, viết report
- `spectator` — Spectator: xem race, đặt cược ảo
- `admin` — Administrator: quản lý hệ thống

### 4.2. Grade System (theo Kentucky Derby thực tế)

**4 grades**: Maiden < G3 < G2 < G1

**Points distribution (chỉ top 5 nhận điểm):**
```js
const POINTS_BY_GRADE = {
  Maiden: [10, 5, 3, 2, 1],
  G3:     [20, 10, 6, 4, 2],
  G2:     [50, 25, 15, 10, 5],
  G1:    [100, 50, 25, 15, 10]
};
```

**Grade thresholds (chỉ lên hạng, không xuống hạng):**
```js
const GRADE_THRESHOLDS = {
  Maiden: 0,
  G3: 20,
  G2: 50,
  G1: 100
};
```

**Quy tắc**: Sau mỗi race, cộng `pointsEarned` vào `horse.totalPoints`. Nếu vượt threshold của grade kế tiếp → auto-upgrade `horse.currentGrade`. Points tích lũy vĩnh viễn theo career, KHÔNG reset.

### 4.3. Prize Distribution

**Top 6 nhận tiền (chia Purse), KHÔNG chia điểm:**
```js
const PRIZE_RATIO = [0.60, 0.20, 0.10, 0.05, 0.03, 0.02];
```

### 4.4. Race Configuration

| Grade | maxCapacity điển hình |
|---|---|
| Maiden | 12–14 |
| G3 | 14–16 |
| G2 | 16–18 |
| G1 | 18–20 |

Admin nhập `maxCapacity` khi tạo race (không hardcode).

### 4.5. Cutoffs

| Cutoff | Thời điểm | Áp dụng |
|---|---|---|
| Registration cutoff | 48–72h trước race | Owner đăng ký ngựa |
| Betting cutoff | 1h trước race | Spectator đặt cược |
| Auto race start | scheduledTime | Cron mỗi 30s detect |

### 4.6. Refund Rules

| Tình huống | Owner refund | Spectator refund |
|---|---|---|
| Owner hủy đăng ký tự nguyện | 40% phí | N/A |
| Ngựa bị Referee disqualify pre-race | 70% phí | 100% bet |
| Bet thua | N/A | 0% |
| Race bị cancel | 100% phí | 100% bet |

### 4.7. Betting System

**Dynamic pool-based odds** (KHÔNG dùng pari-mutuel thuần; multiplier khóa tại thời điểm đặt cược):

| Bet Type | Điều kiện thắng | Base odds (anchor) | Min–Max |
|---|---|---|---|
| Win | Ngựa về top 1 | x3 | 1.2x – 15x |
| Place | Ngựa về top 1 hoặc 2 | x2 | 1.1x – 8x |
| Show | Ngựa về top 1, 2, hoặc 3 | x1.5 | 1.05x – 5x |

**Công thức multiplier (tại thời điểm đặt):**
```js
poolShare = tổng_cược_ngựa_X_loại_Y / tổng_cược_race_loại_Y
aiProb = win/top3 probability từ AI prediction (theo bet type)
multiplier = clamp(baseOdds × (1 - poolShare×0.85) - aiProb×base×0.35×0.6 + formBonus, min, max)
impliedProb = 0.6 × aiProb + 0.4 × poolShare  // hiển thị tham khảo
```

**Quy tắc:**
- Multiplier **lock** vào `bet.multiplier` khi đặt — không đổi sau đó.
- Pool cược hiển thị **theo từng ngựa × từng loại cược** (Win / Place / Show).
- Cập nhật odds realtime qua Socket.IO event `bet:pool_updated` (room `betting:{raceId}`).
- API: `GET /bets/race/:raceId/odds`
- Ngựa nhiều cược → `poolShare` cao → multiplier thấp; ít cược → multiplier cao hơn.

**Thêm loại cược mới (extensible):**
1. Thêm key vào `BET_ODDS_CONFIG.baseOdds` + `bounds` trong `backend/src/config/constants.js`
2. Thêm `enum` vào `bet.model.js`, `bet.routes.js` validation
3. Thêm win condition trong `settleBets` / `settleBetsWithSession`
4. Thêm cột hiển thị pool/odds trên frontend betting modal
5. Cập nhật bảng điều kiện thắng ở section này

### 4.8. Jockey Rules
- 1 jockey chỉ cưỡi 1 ngựa trong cùng 1 Race (không cưỡi nhiều ngựa cùng race).
- 1 jockey có thể cưỡi nhiều ngựa khác nhau trong cùng Tournament (race khác nhau).
- 1 ngựa có thể có nhiều "regular jockeys" (jockey ruột).

### 4.9. Race Status Flow
```
open → closed → pre_check → running → finished
  ↓                                       
cancelled (admin only)
```

| Status | Mô tả |
|---|---|
| `open` | Đang mở đăng ký |
| `closed` | Đã đóng đăng ký (qua cutoffTime) |
| `pre_check` | Referee đang kiểm tra ngựa |
| `running` | Simulation đang chạy |
| `finished` | Đã có kết quả, đã trao thưởng |
| `cancelled` | Bị hủy (do admin) |

### 4.10. Wallet Rules
- **Wallet thống nhất** cho mọi user (Owner, Jockey, Spectator có thể dùng coin để nạp/rút/thưởng).
- Mọi thay đổi balance đều tạo record trong `transactions` collection (audit trail).
- Top-up qua Stripe sandbox.
- Withdraw làm sau (out of scope phase 1).

---

## 5. DATABASE SCHEMA (MongoDB)

### 5.1. Collections (12)

1. **users** — Tài khoản, role-based
2. **wallets** — Ví coin, 1-1 với users
3. **transactions** — Lịch sử giao dịch
4. **horses** — Ngựa đua
5. **jockey_invitations** — Lời mời owner → jockey
6. **tournaments** — Giải đấu
7. **races** — Cuộc đua trong tournament
8. **registrations** — Đăng ký ngựa vào race
9. **race_results** — Kết quả từng ngựa sau race
10. **bets** — Cược của spectator
11. **referee_reports** — Biên bản trọng tài
12. **notifications** — In-app notification (optional)

### 5.2. Key field references

**users**:
```js
{
  _id, email (unique), passwordHash, fullName, phone, avatarUrl,
  role: "owner" | "jockey" | "referee" | "spectator" | "admin",
  walletId: ObjectId,
  jockeyProfile: {           // chỉ fill nếu role = jockey
    experienceYears, weight, height, winCount, raceCount, bio
  },
  refereeProfile: {          // chỉ fill nếu role = referee
    licenseNumber, yearsOfService
  },
  isActive: Boolean,
  createdAt, updatedAt
}
```

**horses**:
```js
{
  _id, ownerId, name, breed, gender, birthDate, weight, color, imageUrl,
  currentGrade: "Maiden" | "G3" | "G2" | "G1",
  totalPoints: Number,       // tích lũy vĩnh viễn
  totalEarnings: Number,
  raceCount, winCount,
  regularJockeys: [ObjectId],  // jockey ruột
  violations: [{
    name, handling, penaltyDate, raceId, note
  }],
  isActive: Boolean
}
```

**races**:
```js
{
  _id, tournamentId, name, grade,
  maxCapacity, purse, registrationFee,
  scheduledTime, cutoffTime, distance,
  eligibility: { allowedGrades, minPoints, minAge, maxAge },
  refereeId,
  status: "open" | "closed" | "pre_check" | "running" | "finished" | "cancelled"
}
```

**registrations**:
```js
{
  _id, raceId, horseId, ownerId, jockeyId,
  feePaid, status,
  preCheckResult: { status: "passed"|"failed"|"pending", note, checkedAt },
  registeredAt, cancelledAt, refundAmount
}
```

**race_results**:
```js
{
  _id, raceId, registrationId, horseId, jockeyId,
  position, finishTime, prizeAmount, pointsEarned
}
```

**bets**:
```js
{
  _id, spectatorId, raceId, horseId,
  betType: "win" | "place" | "show",
  amount, multiplier, status, payoutAmount,
  createdAt, settledAt
}
```

**transactions**:
```js
{
  _id, walletId, userId,
  type: "topup" | "registration_fee" | "registration_refund" 
      | "prize_payout" | "bet_placed" | "bet_payout" | "bet_refund",
  amount,        // dương = vào ví, âm = ra ví
  balanceAfter,  // snapshot
  relatedId, relatedModel, description
}
```

### 5.3. Indexes
```
users:         { email: 1 } unique, { role: 1 }
wallets:       { userId: 1 } unique
transactions:  { walletId: 1, createdAt: -1 }, { userId: 1, type: 1 }
horses:        { ownerId: 1 }, { currentGrade: 1, totalPoints: -1 }
races:         { tournamentId: 1 }, { scheduledTime: 1, status: 1 }
registrations: { raceId: 1, horseId: 1 } unique compound, { ownerId: 1 }
race_results:  { raceId: 1, position: 1 }, { horseId: 1, createdAt: -1 }
bets:          { spectatorId: 1, createdAt: -1 }, { raceId: 1, status: 1 }
notifications: { userId: 1, isRead: 1, createdAt: -1 }
```

---

## 6. AI MODULES

### 7.1. Module 1 — Win Probability Prediction

**Bài toán**: Multi-class classification — dự đoán xác suất từng ngựa về top 1.

**Model**: XGBoost Classifier (baseline: Logistic Regression, comparison: Random Forest)

**Input features**:
- `horse_win_rate` = horse.winCount / horse.raceCount
- `horse_grade_weight` = {Maiden: 0.25, G3: 0.50, G2: 0.75, G1: 1.0}
- `horse_total_points` (normalized: min(points/100, 1))
- `horse_age`, `horse_weight`
- `jockey_win_rate`, `jockey_experience_years`
- `race_distance`, `race_grade`, `field_size`

**Output**: Probability distribution `[P(horse_1), ..., P(horse_n)]`, tổng = 1 (softmax)

**Công thức (fallback nếu chưa có ML model trained)**:
```js
const WEIGHTS = {
  horseWinRate: 0.40,
  gradeWeight: 0.15,
  pointsWeight: 0.20,
  jockeyWinRate: 0.25
};

raw_score_i = w1*horseWinRate + w2*gradeWeight + w3*pointsWeight + w4*jockeyWinRate

// Softmax với beta = 5 để amplify khác biệt
P(horse_i) = exp(beta * score_i) / Σ exp(beta * score_j)
```

**Metrics target**:
- Top-1 Accuracy ≥ 35%
- Top-3 Accuracy ≥ 60%
- Log Loss ≤ 1.5

**Justification academic**: Bolton & Chapman (1986) Multinomial Logit Model.

### 7.2. Module 2 — AI Race Simulation Engine

**Bài toán**: Regression — predict `finish_time` (milliseconds) cho từng ngựa.

**Model**: LightGBM Regressor + Gaussian noise injection

**Input features**: tương tự Module 1 + `track_condition` (giả lập)

**Output**: `predicted_finish_time` → sort → position

**Noise injection**: `final_time = predicted_time + N(0, sigma)` để giữ tính ngẫu nhiên

**Metrics target**:
- MAE ≤ 2.5s
- Spearman correlation ≥ 0.7

### 7.3. Module 3 — Race Recommendation

**Bài toán**: Recommendation — gợi ý race cho spectator.

**Approach**: Hybrid (Collaborative Filtering + Content-Based)
- **CF**: Matrix Factorization (SVD/ALS) trên `user × race × bet_amount`
- **CB**: Similarity giữa race dựa trên grade, distance, ngựa/jockey tham gia
- **Hybrid**: `final_score = 0.6 * CF + 0.4 * CB`
- **Cold-start**: fallback về CB hoặc popular races

**Library**: `surprise` cho CF, `scikit-learn` cho CB

**Metrics target**:
- Precision@5 ≥ 0.25
- NDCG@5 ≥ 0.40

### 7.4. AI Service API (Python FastAPI)

```
POST /predict/win-probability
  Body: { raceId, horses: [{ horseId, ...features }], jockeys: [...] }
  Response: { predictions: [{ horseId, winProbability }] }

POST /simulate/race
  Body: { raceId, horses: [...], jockeys: [...] }
  Response: { results: [{ horseId, finishTime, position }] }

POST /recommend/races
  Body: { spectatorId, k: 5 }
  Response: { recommendations: [{ raceId, score, reason }] }

GET /health
  Response: { status: "ok", models_loaded: [...] }
```

---

## 7. USE CASES (51 total)

### Horse Owner (14 UCs)
- UC-O1: Đăng ký / Đăng nhập
- UC-O2: Quản lý profile
- UC-O3: CRUD ngựa
- UC-O4: Xem lịch sử race của ngựa
- UC-O5: Gửi invitation cho jockey
- UC-O6: Quản lý regular jockey
- UC-O7: Xem race có thể đăng ký
- UC-O8: Đăng ký ngựa vào race
- UC-O9: Hủy đăng ký
- UC-O10: Xem lịch thi đấu
- UC-O11: Xem live race
- UC-O12: Xem bảng xếp hạng
- UC-O13: Nạp coin
- UC-O14: Xem transaction history

### Jockey (9 UCs)
- UC-J1: Đăng ký / Đăng nhập
- UC-J2: Quản lý jockey profile
- UC-J3: Xem danh sách invitation
- UC-J4: Accept / Reject invitation
- UC-J5: Xem race được assign
- UC-J6: Xem lịch sử race cá nhân
- UC-J7: Xem bảng xếp hạng jockey
- UC-J8: Xem earnings + transactions
- UC-J9: Nạp coin

### Race Referee (8 UCs)
- UC-R1: Đăng nhập
- UC-R2: Xem race được phân công
- UC-R3: Pre-race horse inspection
- UC-R4: Live monitor race
- UC-R5: Ghi nhận incidents
- UC-R6: Confirm kết quả race
- UC-R7: Tạo Referee Report
- UC-R8: Export Report PDF

### Spectator (10 UCs)
- UC-S1: Đăng ký / Đăng nhập
- UC-S2: Xem tournament + lịch race
- UC-S3: Xem chi tiết race
- UC-S4: Xem profile horse/jockey
- UC-S5: Nạp coin
- UC-S6: Đặt cược Win/Place/Show
- UC-S7: Xem live race
- UC-S8: Xem kết quả + ranking
- UC-S9: Xem lịch sử bet
- UC-S10: Xem transaction history

### Admin (10 UCs)
- UC-A1: Đăng nhập
- UC-A2: Quản lý users
- UC-A3: CRUD tournament
- UC-A4: CRUD race
- UC-A5: Phân công referee
- UC-A6: Xem tất cả registration
- UC-A7: Override race result
- UC-A8: Force settle bet
- UC-A9: Xem dashboard
- UC-A10: Xem danh sách bet

---

## 8. ROADMAP 8 TUẦN

| Tuần | Mốc chính |
|---|---|
| **1** | Setup repo (BE + FE + Mobile skeleton), MongoDB, base JWT auth, Docker, CI/CD |
| **2** | User & Wallet module (M1, M9) + Stripe sandbox integration |
| **3** | Horse, Jockey, Invitation module (M2, M3) |
| **4** | Tournament & Race CRUD (M4) + Admin dashboard skeleton |
| **5** | Registration + Race Simulation Engine baseline (M5, M6) — random version |
| **6** | AI training: train 3 models trên synthetic data + setup Python FastAPI service |
| **7** | Integrate AI service vào BE + Betting module (M10) + Notification |
| **8** | Mobile app (Spectator) + Deploy production + Testing + Documentation + Demo |

---

## 9. TEAM ASSIGNMENT (gợi ý)

| Member | Vai trò chính | Vai trò phụ |
|---|---|---|
| **Member 1 — Backend Lead** | Node.js API, MongoDB schema, Socket.IO, JWT auth | Deploy backend |
| **Member 2 — Frontend Web** | React + Vite + TS, Ant Design, Tailwind | UI/UX design |
| **Member 3 — Mobile + Integration** | React Native + Expo (Spectator app), gọi API AI | Mobile testing |
| **Member 4 — AI/ML + DevOps** | Train 3 AI models, FastAPI service, CI/CD, deploy | AI documentation |

---

## 10. FOLDER STRUCTURE (Đề xuất)

```
horse-racing-system/
├── backend/                   # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/           # DB connection, env, Stripe
│   │   ├── models/           # Mongoose schemas (12 collections)
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, error, validation
│   │   ├── routes/           # API routes
│   │   ├── sockets/          # Socket.IO handlers (race simulation)
│   │   ├── jobs/             # node-cron jobs
│   │   ├── utils/            # Helpers (PDF gen, etc.)
│   │   └── server.ts
│   ├── tests/
│   └── package.json
│
├── frontend/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/       # Shared components
│   │   ├── pages/            # Pages by role
│   │   │   ├── owner/
│   │   │   ├── jockey/
│   │   │   ├── referee/
│   │   │   ├── spectator/
│   │   │   └── admin/
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API clients (axios + react-query)
│   │   ├── types/            # TypeScript types
│   │   ├── utils/
│   │   └── main.tsx
│   ├── public/
│   └── package.json
│
├── mobile/                    # React Native + Expo (Spectator)
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.tsx
│   └── package.json
│
├── ai-service/                # Python FastAPI
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── models/           # ML model loading
│   │   ├── services/         # Prediction logic
│   │   └── main.py
│   ├── notebooks/            # Jupyter for training
│   ├── trained_models/       # .pkl files
│   ├── data/                 # Synthetic + real data
│   └── requirements.txt
│
├── docs/
│   ├── 01_topic_proposal/
│   ├── 02_related_work/
│   ├── api/                  # Swagger
│   └── diagrams/             # ERD, use case, flows
│
├── docker-compose.yml
├── .github/workflows/        # CI/CD
├── CLAUDE.md                  # File này
└── README.md
```

---

## 11. COMMIT MESSAGE CONVENTION

```
<type>: <description in English, lowercase, no period>
```

| Type | Khi nào dùng | Ví dụ |
|---|---|---|
| `feat` | Tính năng mới | `feat: add horse registration endpoint` |
| `fix` | Sửa lỗi | `fix: correct prize calculation for top 6` |
| `docs` | Tài liệu | `docs: update API spec for betting` |
| `refactor` | Refactor code | `refactor: extract wallet service` |
| `test` | Thêm test | `test: add unit tests for grade upgrade logic` |
| `style` | Format code | `style: fix lint warnings in user controller` |
| `chore` | Việc lặt vặt | `chore: bump dependencies` |
| `topic` | Cập nhật đề tài | `topic: refine AI module scope` |
| `review` | Phân tích paper | `review: add Bolton Chapman 1986 analysis` |
| `method` | Phương pháp | `method: add softmax normalization formula` |
| `experiment` | Setup eval | `experiment: define baseline metrics` |
| `result` | Kết quả | `result: add XGBoost benchmark table` |
| `figure` | Hình/diagram | `figure: add ERD with relationships` |

---

## 12. IMPORTANT CONSTRAINTS & DECISIONS

### 12.1. Out of Scope (KHÔNG làm)
- ❌ Mobile native (iOS + Android song song) — chỉ React Native Expo Android
- ❌ Tiền thật / Payment gateway production — chỉ Stripe sandbox
- ❌ IoT GPS tracking ngựa thật — chỉ simulation
- ❌ Email/SMS notification — chỉ in-app notification
- ❌ Multi-language (i18n) — nice-to-have nếu còn thời gian
- ❌ Đa cấp admin (super/sub admin) — chỉ 1 cấp admin
- ❌ Audit log toàn hệ thống — không bắt buộc
- ❌ Withdraw coin từ wallet — phase 2

### 12.2. Critical decisions
- **MongoDB** thay vì SQL: cho phép embed (profile, violations, eligibility) → giảm join
- **Wallet thống nhất** cho mọi role (không tách coin/tiền)
- **Dynamic pool-based odds** cho betting — multiplier khóa khi đặt, cập nhật realtime qua socket
- **Race simulation tự động** qua cron (không manual trigger)
- **Pre-race inspection thủ công** bởi referee (manual step duy nhất)
- **Points tích lũy vĩnh viễn** theo career, không reset theo season
- **Chỉ lên hạng, không xuống hạng**

### 12.3. Coding rules
- TypeScript strict mode bật toàn bộ
- Backend: tất cả route phải có middleware auth + validation
- Frontend: TanStack Query cho mọi API call, KHÔNG dùng useEffect + fetch
- KHÔNG hardcode magic numbers — đặt vào `config/constants.ts`
- Mọi DB transaction cần balance update phải dùng MongoDB session (atomic)
- Mọi async function phải try-catch + log error
- KHÔNG commit `.env`, `node_modules`, `dist/`, `.pkl` files lớn (dùng Git LFS nếu cần)

---

## 13. RESPONSE STYLE PREFERENCES (cho AI assistant)

Khi sinh code hoặc trả lời câu hỏi về project này:

- **Ngắn gọn, đi thẳng vào vấn đề**, không lan man
- **Code trước, giải thích ngắn sau**, không comment hiển nhiên
- **Tiếng Việt** cho giải thích, **tiếng Anh** cho code/identifier
- **Thuật ngữ kỹ thuật giữ nguyên tiếng Anh** (hook, middleware, schema, etc.)
- **Phản hồi thẳng thắn**: code sai → sửa trực tiếp, không rào trước
- Nếu có nhiều cách làm → nêu **trade-off ngắn gọn**
- Tuân thủ business rules ở Section 4, KHÔNG tự đề xuất thay đổi nếu không được hỏi
- Tuân thủ tech stack ở Section 2, KHÔNG đề xuất công nghệ khác trừ khi có lý do mạnh

---

## 14. RELATED PAPERS (REFERENCES)

### Theoretical foundation
1. **Bolton & Chapman (1986)** — Multinomial Logit Model for Handicapping Horse Races. *Management Science*. DOI: 10.1287/mnsc.32.8.1040
2. **Chapman (2008)** — Empirical Results from 2,000 Hong Kong Races. *Efficiency of Racetrack Betting Markets*.
3. **Pudaruth et al. (2013)** — Weighted Probabilistic Approach. *IJCA*.
4. **Edelman (2003)** — Handicapping Algorithm based on ANCOVA.
5. **Zhang (2022)** — Optimal Model based on Association Rules and Neural Network. DOI: 10.1155/2022/4240244

### ML methods
6. **Chen & Guestrin (2016)** — XGBoost. KDD'16. DOI: 10.1145/2939672.2939785
7. **Ke et al. (2017)** — LightGBM. NeurIPS.
8. **Koren et al. (2009)** — Matrix Factorization for Recommender Systems. *IEEE Computer*.

### Domain references
9. **Renham (2022)** — Apprentice Jockeys Revisited. On Course Profits (industry analysis).
10. **British Horseracing Authority** — Official handicap rating documentation.

---

## 15. QUICK REFERENCE — CONSTANTS

```typescript
// constants.ts
export const POINTS_BY_GRADE = {
  Maiden: [10, 5, 3, 2, 1],
  G3:     [20, 10, 6, 4, 2],
  G2:     [50, 25, 15, 10, 5],
  G1:    [100, 50, 25, 15, 10]
} as const;

export const PRIZE_RATIO = [0.60, 0.20, 0.10, 0.05, 0.03, 0.02] as const;

export const GRADE_THRESHOLDS = {
  Maiden: 0,
  G3: 20,
  G2: 50,
  G1: 100
} as const;

export const BET_MULTIPLIERS = {
  win: 3,
  place: 2,
  show: 1.5
} as const; // base anchor — actual odds are dynamic (see BET_ODDS_CONFIG)

export const BET_ODDS_CONFIG = {
  baseOdds: BET_MULTIPLIERS,
  bounds: { win: [1.2, 15], place: [1.1, 8], show: [1.05, 5] },
  historyWeight: 0.6,
  poolWeight: 0.4,
  upsetChance: 0.25,
  raceSegments: 4,
} as const;

export const REFUND_RATES = {
  ownerCancel: 0.40,           // owner hủy tự nguyện
  disqualifyOwner: 0.70,       // referee DQ → owner
  disqualifySpectator: 1.00,   // referee DQ → spectator
  cancelled: 1.00              // race cancel
} as const;

export const CUTOFFS = {
  registrationHoursMin: 48,
  registrationHoursMax: 72,
  bettingHours: 1
} as const;

export const CRON_INTERVALS = {
  raceCheckSeconds: 30
} as const;

export const AI_CONFIG = {
  winProbability: {
    weights: {
      horseWinRate: 0.40,
      gradeWeight: 0.15,
      pointsWeight: 0.20,
      jockeyWinRate: 0.25
    },
    gradeWeights: { Maiden: 0.25, G3: 0.50, G2: 0.75, G1: 1.0 },
    softmaxBeta: 5
  },
  recommendation: {
    cfWeight: 0.6,
    cbWeight: 0.4
  }
} as const;
```

---

**LAST UPDATED**: 25/05/2026

**MAINTAINED BY**: Group G07 — SE1823

> Khi project có thay đổi business rule hoặc tech stack → cập nhật file này TRƯỚC khi sửa code.
