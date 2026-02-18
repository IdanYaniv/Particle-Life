# Particle Life

**A Generative Systems Experiment**

Particle Life is a creative coding experiment exploring how simple deterministic rules can produce organic, living visual behavior — and what happens when those rules begin to break.

At its core, the system simulates thousands of interacting particles governed by attraction and repulsion forces. These interactions form fluid clusters and evolving structures in real time.

But the system is not purely stable.

A mutation layer introduces controlled randomness that disrupts equilibrium.
Behavior can drift. Structures can destabilize. Patterns can spread unpredictably.

The system organizes — and sometimes fails to.

---

## Thesis

This project explores two ideas:

- Can deterministic systems feel expressive and alive?
- What happens when instability and mutation are introduced into an otherwise rule-based system?

In biological systems, we cannot always fully contain or correct mutation.
Intervention can influence outcomes — but not guarantee resolution.

Particle Life brings that dynamic into an interactive visual system.

Users can influence environmental forces and attempt to stabilize disruptions.
Sometimes the system recovers.
Sometimes it partially recovers.
Sometimes instability persists.

The outcome is not fully predictable.

---

## What It Does

- Simulates large-scale particle interaction in real time
- Uses deterministic force rules as a behavioral foundation
- Introduces probabilistic mutation that alters system balance
- Allows user intervention without granting total control
- Renders evolving structures through GPU-accelerated graphics

The experience sits between order and instability.

---

## System Model

**Deterministic Core**
Local interaction rules generate global structure.

**Mutation Layer**
Randomized drift and force variation disrupt stability over time.

**User Influence**
The UI allows modulation of system forces.
Intervention can guide the system, but cannot eliminate uncertainty.

---

## Technical Foundation

- WebGL2 for GPU-based simulation and rendering
- Modular JavaScript architecture
- Real-time parameter modulation
- No runtime dependencies
- Static build output

---

## Why This Exists

Digital systems are typically predictable and fully controllable.

Particle Life explores a different dynamic:

A system that behaves more like a biological process —
influenceable, but not entirely containable.

It is an experiment in emergent behavior, instability, and interactive negotiation between user and system.
