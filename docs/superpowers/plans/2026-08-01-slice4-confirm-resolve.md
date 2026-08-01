# Plan: Slice 4 — Confirm results + incident resolution

> For agent: leave uncommitted unless user asks.

**Spec:** `docs/superpowers/specs/2026-08-01-referee-steward-flow-design.md` §7  
**Branch:** `feat/pre-race-stewards-report`

## Goal

After `finished`: referee confirms results (idempotent; no `isOfficial` / re-settle). Resolve draft incidents with stored verdict only.

## Done

- [x] `Race.resultsConfirmedAt` / `resultsConfirmedBy`
- [x] `POST /referee/races/:raceId/confirm-results`
- [x] Incident `resolution` + `PATCH .../incidents/:id/resolve`
- [x] FE `/referee/results` + confirm UI
- [x] FE resolve dialog in Edit Report (draft flags)

## Verify

- Confirm on non-finished → 400; wrong referee → 403
- Re-confirm → same race, no error
- Fine without fineAmount → 400
- DQ / fine do not change race_results or wallet
