### Task 5: Zod route validation

**Files:**
- Modify: `backend/src/routes/referee.routes.js`

- [ ] **Step 1: Replace `updateReportSchema`**

```js
const { PRE_RACE_TRACK_CONDITIONS } = require('../config/constants');

const trackEnum = z.enum(PRE_RACE_TRACK_CONDITIONS);

const updateReportSchema = z.object({
  overallNotes: z.string().max(2000).optional(),
  preRaceReport: z.object({
    trackCondition: z.union([trackEnum, z.literal('')]).optional(),
    trackConditionNote: z.string().max(500).optional(),
    riderChanges: z.array(z.string().max(300)).max(50).optional(),
    gearChanges: z.array(z.string().max(300)).max(50).optional(),
    vetChecks: z.array(z.string().max(300)).max(50).optional(),
  }).optional(),
}).refine(
  (d) => d.overallNotes !== undefined || d.preRaceReport !== undefined,
  { message: 'At least one field required' },
);
```

Remove `preCheckSummary` from schema entirely.

- [ ] **Step 2: Quick Zod smoke**

```bash
node -e "const {z}=require('zod'); const TRACK=['Firm','Good','Soft','Heavy','Synthetic']; const trackEnum=z.enum(TRACK); const s=z.object({preRaceReport:z.object({trackCondition:z.union([trackEnum,z.literal('')]).optional()}).optional()}); console.log(s.safeParse({preRaceReport:{trackCondition:'Good'}}).success); console.log(s.safeParse({preRaceReport:{trackCondition:'dry'}}).success);"
```

Expected: `true` then `false`

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/referee.routes.js
git commit -m "$(cat <<'EOF'
feat: validate preRaceReport on referee report update

EOF
)"
```

---


