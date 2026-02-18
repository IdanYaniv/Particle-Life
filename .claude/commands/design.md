# DESIGN.md — Product, UX, and Craft Bar

This document defines the **creative and design bar** for this product.
It is intentionally opinionated.

If there is tension between speed and craft:
- default to speed for internal plumbing
- default to craft for user-facing, core flows

Design quality is not decoration. It is product clarity.

---

## Our bar

We aim to build products that feel:
- intentional, not accidental
- calm, not cluttered
- powerful without being complex

Fewer things done exceptionally well > more things done adequately.

If something feels “fine”, it’s probably not good enough.

---

## Design principles (non-negotiable)

- **Clarity beats cleverness**  
  If the user has to think, we failed.

- **Strong defaults, soft edges**  
  The product should guide users naturally, without forcing or nagging.

- **Consistency is a feature**  
  Visual language, interaction patterns, and terminology must align across the product.

- **Respect the user’s attention**  
  Every element must earn its place. Remove before adding.

---

## UX expectations

For every meaningful user-facing feature:

- Clear mental model: the user should understand *what this is* and *what happens next*
- Thoughtful empty, loading, and error states (not placeholders)
- Predictable behavior over surprising behavior
- Accessibility and readability are baseline, not stretch goals

If the experience degrades under edge cases, it’s not done.

---

## Visual & interaction craft

- Avoid “template-looking” UI unless explicitly chosen
- Do not blindly accept framework defaults (spacing, typography, motion)
- Motion and micro-interactions should clarify state, not decorate
- Typography, hierarchy, and rhythm matter as much as layout

If a screen looks busy, something is wrong.

---

## Creative ambition

When working on **core flows** (onboarding, primary actions, dashboards):

- Always question the obvious solution
- Propose at least one alternative direction when appropriate
- Call out tradeoffs explicitly (clarity vs density, speed vs control, etc.)
- Push beyond safe patterns **only** when it improves understanding or delight

Novelty for its own sake is not a goal.
Memorability through clarity is.

---

## Working with AI on design

When generating UI, flows, or copy:

- Do not settle for the first acceptable solution
- Explore multiple directions when the space is user-facing and important
- Explain *why* a direction is better, not just *what* it is
- Flag when a solution is “safe” vs “ambitious”

AI should help us raise the bar, not average it out.

---

## When to slow down intentionally

It is acceptable — expected — to slow down when:
- defining a new core concept or mental model
- setting a visual language that will propagate
- designing something users will see repeatedly

We move fast by being deliberate where it counts.

---

## Final check (gut test)

Before shipping user-facing work, ask:
- Would I be proud to show this to a top-tier product designer?
- Is this something I’d want to use daily?
- Did we remove everything that doesn’t add value?

If the answer is “almost” — it’s not ready.