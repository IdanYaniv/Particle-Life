/document
# Documentation Update Stage

Update documentation **only where behavior has actually changed**.
Documentation must reflect reality, not intent.

---

## Rules (non-negotiable)

- Do NOT trust existing documentation
- Read the code first, then document
- Do NOT document internal refactors unless they affect usage
- If user-facing impact is unclear, stop and ask

---

## Step 1: Identify Relevant Changes

- Inspect `git diff` and recent commits
- List:
  - files modified
  - files added / removed / renamed
- Identify which changes affect:
  - user behavior
  - developer usage
  - configuration or setup

If a change has **no external impact**, note it and skip documentation.

---

## Step 2: Verify Actual Behavior

For each relevant change:
- Read the current implementation
- Understand what it actually does now
- Compare against existing documentation
- Identify mismatches, gaps, or outdated info

Document reality, not comments or intentions.

---

## Step 3: Update Documentation

### CHANGELOG.md
- Add entry under **Unreleased**
- Use categories: Added / Changed / Fixed / Security / Removed
- Write in concise, user-facing language
- Focus on *what changed*, not how it was implemented

Update other docs **only if necessary**:
- README
- Setup guides
- Feature docs

Avoid touching files unless the change is justified.

---

## Step 4: Documentation Style

✅ Concise — clarity over grammar  
✅ Practical — examples > explanations  
✅ Accurate — code-verified only  
✅ Current — reflects latest behavior  

❌ No fluff  
❌ No speculation  
❌ No “future intent”  

---

## Step 5: Report

At the end, provide a short summary:

### Documentation Updated
- [file] — reason

### Intentionally Not Updated
- [file] — why (no user-facing impact)

### Open Questions
- [question] (if any)

---

## Ask If Uncertain

If intent or user impact is unclear, **ask before writing**.
Never guess.