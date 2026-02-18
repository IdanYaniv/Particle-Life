# Plan Creation Stage

Produce a **single, execution-ready markdown plan**.
This document defines *what will be built* and *what will not*.

This is a planning artifact only.
**Do not write code. Do not suggest refactors. Do not optimize prematurely.**

---

## Planning Contract (non-negotiable)

- Prefer **clarity over completeness**
- Prefer **fewer steps** over exhaustive breakdowns
- Do NOT introduce scope beyond what was explicitly discussed
- Do NOT “future-proof” unless explicitly requested
- If uncertain, ask a question instead of guessing

---

## Status & Progress

Each step must include a status indicator:
- 🟥 To Do
- 🟨 In Progress
- 🟩 Done

**Overall Progress** must be calculated automatically:
> (🟩 completed steps / total steps) × 100

---

# Feature Implementation Plan

**Overall Progress:** _calculated_

---

## TL;DR
What we’re building, for whom, and why now — in 2 sentences max.

---

## Context Snapshot
Minimal context needed to understand the plan without rereading the full thread.
(Constraints, assumptions, key inputs.)

---

## Decisions Locked In
These decisions are considered final for this plan.

- **Decision:** [choice]  
  **Reason:** [clear, concrete rationale]  
  **Tradeoff accepted:** [what we’re consciously giving up]

---

## Explicitly Out of Scope
Anything not listed here is assumed **out of scope**.

- Not doing X
- Not handling Y
- Not optimizing Z

---

## Risks & Unknowns
Only include items that could:
- block execution
- invalidate decisions
- require revisiting scope

If unresolved, mark clearly.

---

## Plan

- 🟥 **Step 1: [Outcome-oriented name]**
  - 🟥 Subtask (if truly necessary)

- 🟥 **Step 2: [Outcome-oriented name]**

(Each step should produce a concrete, verifiable outcome.)

---

## Kill Criteria
We should **pause or stop** this work if:
- [condition]
- [condition]

---

## Exit Criteria
This plan is complete when:
- All steps are 🟩
- Open questions are resolved or consciously accepted
- No additional scope was introduced during execution