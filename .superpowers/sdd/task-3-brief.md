### Task 3: Wire `updatePreCheck` → append Late Scratching

**Files:**
- Modify: `backend/src/services/registration.service.js`
- Consumes: `appendLateScratching` from helper

- [ ] **Step 1: Require helper at top of registration.service.js**

```js
const { appendLateScratching } = require('./referee-prerace.helper');
const { Horse } = require('../models/horse.model'); // only if not already imported
```

(Check existing imports — reuse Horse model if already present; otherwise add.)

- [ ] **Step 2: Inside `updatePreCheck`, after successful fail path (inside transaction, after `reg.save`)**

Resolve horse name before/inside transaction:

```js
  // before session block when status === 'failed':
  let horseName = 'Unknown horse';
  if (reg.horseId) {
    const horse = await Horse.findById(reg.horseId).select('name');
    if (horse?.name) horseName = horse.name;
  }
```

After `await reg.save({ session })` and **before** `commitTransaction`:

```js
      await appendLateScratching(
        {
          raceId: race._id,
          refereeId,
          registrationId: reg._id,
          horseId: reg.horseId,
          note: note || '',
          horseName,
        },
        session,
      );
```

If `appendLateScratching` fails, transaction aborts — correct (atomic DQ + report sync).

- [ ] **Step 3: Manual verify (requires running Mongo + seeded race in `pre_check`)**

Call existing pre-check fail endpoint as assigned referee; then:

```js
// In mongosh or a one-off script:
db.refereereports.findOne({ raceId: ObjectId('...') })
// expect preRaceReport.lateScratchings.length >= 1 with label containing horse name
```

If local env unavailable, defer to Task 7 smoke; still commit wiring.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/registration.service.js
git commit -m "$(cat <<'EOF'
feat: sync late scratchings on pre-check failure

EOF
)"
```

---


