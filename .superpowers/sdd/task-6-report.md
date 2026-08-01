# Task 6 Report: Frontend API types

**Branch:** `feat/pre-race-stewards-report`  
**Date:** 2026-07-31  
**Status:** Complete

## Summary

- Added `TrackCondition`, `LateScratching`, `PreRaceReport`, and `UpdateRefereeReportPayload` to `frontend/src/app/api/referee.ts`.
- Extended `RefereeReport` with `preRaceReport`; removed deprecated `preCheckSummary` from FE types.
- Updated `updateReport` to accept `UpdateRefereeReportPayload` (editable pre-race fields only; no `lateScratchings`).

## Verification

| Check | Result |
|---|---|
| `npm run build` (frontend) | Passed |
| Linter on `referee.ts` | No issues |
| `preCheckSummary` references in frontend | None remaining |

## Commit

```text
feat: add preRaceReport types to referee api client
```

## Concern

Task 7 (`RefereeDashboard` edit dialog) must consume these types; any code still passing `preCheckSummary` to `updateReport` will fail type-check once updated.
