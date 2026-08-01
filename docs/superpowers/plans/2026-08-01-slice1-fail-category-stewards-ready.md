# Slice 1: Fail Category + stewardsReady — Implementation Plan

> **For agentic workers:** Implement task-by-task. **Do NOT git commit** — human commits.

**Goal:** Require fail category on pre-check failure, sync it into Late Scratchings, and auto-set `race.stewardsReady` when all horses are checked.

**Architecture:** Extend `preCheckResult` + `lateScratchings`; Zod refine on fail; helper label includes `[CATEGORY]`; `maybeMarkStewardsReady` after each pre-check.

**Tech Stack:** Express, Mongoose, Zod, React/MUI

**Spec:** `docs/superpowers/specs/2026-08-01-referee-steward-flow-design.md` §4

## Global Constraints

- Do not change `race.status` enum
- Do not commit
- Fail categories: `veterinary` | `jockey` | `gear` | `administrative`
- Passed: immediate API, no category
- Failed: category required; DQ + refund + late scratching unchanged otherwise

---

### Task 1: Constants + models
### Task 2: Helper label + append category
### Task 3: Service + Zod + maybeMarkStewardsReady
### Task 4: FE types + fail modal UI

Verify: `node --check` on changed BE files; FE build if feasible.
