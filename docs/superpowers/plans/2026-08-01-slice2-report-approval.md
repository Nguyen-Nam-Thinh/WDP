# Slice 2: Report Approval + isOfficial — Plan

> **Do NOT commit** — human commits.

**Goal:** Report lifecycle `draft → pending_approval → approved|rejected`; admin approve sets `race.isOfficial` without re-settling.

**Spec:** `docs/superpowers/specs/2026-08-01-referee-steward-flow-design.md` §5

## Delivered
- Model status + submittedBy/reviewedBy/rejectReason
- Submit → pending_approval + admin notification type
- Admin GET list / approve / reject under `/referee/admin/reports*`
- Referee FE badges + rejected edit
- Admin page Duyệt biên bản

## Verify
- `node --check` on changed backend files
