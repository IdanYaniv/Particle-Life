/execute
# Execution Stage

Implement the approved plan **exactly as written**.
This stage is about disciplined delivery, not exploration or redesign.

---

## Core Rules (non-negotiable)

- Execute **one plan step at a time**
- Do NOT add scope, refactor unrelated code, or reinterpret decisions
- Do NOT optimize, generalize, or “clean up” unless explicitly required
- If the plan is unclear at execution time, **stop and ask**

---

## Implementation Standards

- Write minimal, modular, readable code
- Follow existing patterns, structure, and conventions
- Prefer small, explicit changes over clever abstractions
- Comments explain *intent or risk*, not obvious behavior
- No debug logs, TODOs, commented-out code, or placeholders

---

## Execution Loop (repeat for each step)

For each plan step:

1. Implement the step as specified
2. Update the plan document:
   - Step status: 🟥 → 🟨 → 🟩
   - Recalculate overall progress
3. Produce a short execution report **before continuing**

---

## Required Execution Report

### Step
- Name: [exact step name from plan]

### Changes
- Files added:
- Files modified:
- Files deleted:

### Commands Run
- [command]

### Notes
- Deviations from plan (must be empty unless approved)
- New risks or concerns (if any)

---

## Stop Immediately If

- A required file, dependency, or pattern does not exist
- A decision would affect architecture, data, auth, or security
- The implementation feels “almost right” but not clearly correct
- You are tempted to improve something outside the plan

Ask before proceeding.

---

## Completion Criteria

Execution is complete when:
- All plan steps are 🟩
- Progress is 100%
- No unapproved scope was introduced
- The system remains production-ready