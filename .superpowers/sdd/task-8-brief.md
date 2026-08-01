### Task 8: Optional doc sync + final smoke

**Files:**
- Modify (optional): `docs/PRECHECK_VA_BAO_CAO_REFEREE.md` — only if team wants copy-paste doc updated; otherwise skip
- Modify: none required if docs deferred

- [ ] **Step 1: End-to-end smoke checklist**

| # | Check | Pass? |
|---|--------|-------|
| 1 | Fail pre-check creates/updates draft report lateScratchings | |
| 2 | Dedupe same registrationId | |
| 3 | PATCH cannot wipe lateScratchings | |
| 4 | Submit without track → 400 | |
| 5 | Submit with Good → 200 | |
| 6 | PDF has 5 headings + Nil | |
| 7 | Legacy preCheckSummary migrates on get/update | |

- [ ] **Step 2: Commit only if docs changed**

```bash
git add docs/PRECHECK_VA_BAO_CAO_REFEREE.md
git commit -m "$(cat <<'EOF'
docs: sync pre-check referee doc with preRaceReport

EOF
)"
```

---


