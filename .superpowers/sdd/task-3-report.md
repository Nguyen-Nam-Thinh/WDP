# Task 3 Report: Sync late scratchings on pre-check failure

**Branch:** `feat/pre-race-stewards-report`  
**Date:** 2026-07-31  
**Status:** Complete (manual Mongo verification deferred)

## Summary

Wired `appendLateScratching` into the failed path of `updatePreCheck` in `backend/src/services/registration.service.js`.

- Reused the existing `Horse` import to resolve the horse name, with `Unknown horse` fallback.
- Appends the late scratching after the disqualified registration is saved and before the transaction commits.
- Passes the active MongoDB session to the helper, so a report-sync failure aborts the registration disqualification and refund transaction.

`referee.service.js` and frontend files were not changed.

## Verification

| Check | Result |
|---|---|
| `node --check src/services/registration.service.js` | Passed (exit 0) |
| `git diff --check -- backend/src/services/registration.service.js` | Passed (exit 0) |
| IDE diagnostics for changed file | No errors |
| Automated tests | Not available: `backend/package.json` defines no test script and no registration-service tests exist |
| Manual Mongo verification | Deferred: no running seeded MongoDB race in `pre_check` was available for this task |

The targeted ESLint command reports 300 existing Prettier violations across this CRLF-formatted file, including unchanged lines. It was not auto-formatted to avoid an unrelated whole-file diff.

## Commit

```text
015ea88 feat: sync late scratchings on pre-check failure
```

## Follow-up

Run the Task 7 smoke test against a seeded race in `pre_check`, fail a registration as its assigned referee, and confirm `refereereports.preRaceReport.lateScratchings` contains the registration with a horse-name label.
