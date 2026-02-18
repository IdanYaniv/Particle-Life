/review
# Code Review Task

Perform a thorough but concise review of the changes provided.
If you do not have diffs or file context, ask for it first.

## Required Inputs (ask if missing)
- List of files changed + brief intent per file
- Key diff snippets (or PR link)
- Any DB/schema changes (migrations, RLS, indexes)
- How to run/test locally (commands)
- Any auth/OAuth changes (providers, redirect URLs)

## Review Priorities (blockers vs follow-ups)
- CRITICAL/HIGH issues block merge
- MEDIUM/LOW are follow-ups unless the fix is trivial

## Check For

**Logging**
- No console.log/debug prints
- Uses structured logger with context where applicable

**Error Handling**
- Async errors handled (try/catch or boundary)
- Helpful user-facing messages + safe fallbacks
- No silent failures

**TypeScript**
- Avoid `any`, `@ts-ignore`
- Types/interfaces reflect real data shapes
- No unsafe casts unless justified

**Production Readiness**
- No TODOs that hide broken behavior
- No hardcoded secrets/keys
- Env vars used correctly (client vs server)

**React/Hooks**
- Effects dependency arrays correct
- Cleanup where needed
- No infinite loops / state updates in render

**Performance**
- No obvious unnecessary re-renders
- Avoid premature memoization; optimize only when clearly needed

**Security**
- Auth + authorization enforced (not only UI)
- Inputs validated/sanitized at boundaries
- DB rules/RLS not overly permissive
- Tokens stored safely (never in localStorage unless explicitly chosen)

**DB / Migrations**
- Schema changes include migration + rollback plan
- RLS policies reviewed for least privilege
- Indexes considered for new query patterns

**Architecture**
- Follows existing patterns
- Code lives in correct directory/layer
- No needless abstractions

## Output Format

### ✅ Looks Good
- [Item 1]
- [Item 2]

### ⚠️ Issues Found
- **[Severity]** [File:line or area] — [Issue]
  - Fix: [Minimal fix]
  - Why it matters: [1 sentence]

### 🔧 Suggested Minimal Patch (optional)
- Provide 1–3 small diff snippets only when it unblocks a CRITICAL/HIGH issue.

### 📊 Summary
- Files reviewed: X
- Critical issues: X
- High: X
- Medium: X
- Low: X

## Severity Levels
- **CRITICAL** — Security, data loss, crashes
- **HIGH** — Bugs, broken UX, major perf regressions
- **MEDIUM** — Maintainability, missing tests, minor UX issues
- **LOW** — Style, small cleanups