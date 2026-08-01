# Plan: Slice 3 — Live Flag → draft incident

> For agent: execute tasks; leave uncommitted unless user asks.

**Spec:** `docs/superpowers/specs/2026-08-01-referee-steward-flow-design.md` §6  
**Branch:** `feat/pre-race-stewards-report`

## Goal

During `race.status === 'running'`, referee taps **Flag** per horse → draft `incident` (`source: live_flag`, no typing). Auto collision out of scope.

## Done

- [x] `incidentSchema`: `source`, `status`, `raceTimeMs`, `flaggedAt`
- [x] `POST /referee/reports/ensure`, `POST /referee/reports/:id/incidents/flag`
- [x] Debounce same horse within 5s
- [x] FE `ensureReport` / `flagIncident`
- [x] Route `/referee/live` + nav
- [x] `LiveFlagPanel`: running races → socket → Flag buttons + draft list

## Verify

- Flag only when race `running`
- Toast shows horse + race time
- Report locked (`pending_approval` / `approved`) → ensure fails with 400
