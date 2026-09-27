# Traffic Light System — Angular 21

A robust, safety-first four-way intersection traffic light controller built with **Angular 21** using native Standalone Components, Angular Signals, TypeScript, HTML, and CSS.

---

## Overview

This application simulates a real-world four-way intersection with four physical traffic lights:
* **North** and **South** (facing pair)
* **East** and **West** (facing pair)

The system is designed with a strict state-machine architecture that enforces traffic safety invariants, validates state transitions before mutating state, and guarantees synchronization between opposing lights. No third-party UI or state-management libraries are used—only native Angular 21 primitives.

---

## How to install dependencies

### Prerequisites
* **Node.js**: v20 or higher
* **npm**: v10 or higher

### Installation
Run the following command in the project root:

```bash
npm install
```

---

## How to run the project

Start the local development server:

```bash
npm start
```

Once the build is complete, open your browser and navigate to:
```text
http://localhost:4200/
```

---

## How to run tests

Execute the complete automated unit test suite using Angular's built-in Vitest runner:

```bash
npm test -- --watch=false
```

To run tests in interactive watch mode during development:

```bash
npm test
```

---

## Explanation of the state model

### Two Orthogonal Logical Axes vs. Four Independent Variables

Instead of tracking four separate variables (`north`, `south`, `east`, `west`), which would produce $4^4 = 256$ possible state combinations and risk opposing lights desynchronizing (e.g. North=GREEN while South=RED), the system groups facing lights into **two orthogonal logical axes**:

1. **`northSouth` (Axis 1)**: Controls the North and South traffic flow.
2. **`eastWest` (Axis 2)**: Controls the East and West traffic flow.

```typescript
export interface TrafficSystemState {
  readonly northSouth: LightState;
  readonly eastWest: LightState;
}
```

Each physical light derives its display state directly from its corresponding axis via reactive computed signals:

```typescript
readonly northLight = computed(() => this._state().northSouth);
readonly southLight = computed(() => this._state().northSouth);
readonly eastLight  = computed(() => this._state().eastWest);
readonly westLight  = computed(() => this._state().eastWest);
```

This ensures it is **structurally impossible** for North and South (or East and West) to disagree. Facing pair synchronization is guaranteed at the architectural level.

---

## Safe states / transitions

### Standard Safe Operating Cycle

The intersection follows a predictable 8-phase safe operating sequence:

| Step | North/South | East/West | Description |
|:---:|:---:|:---:|:---|
| **0** | `GREEN` | `RED` | **Initial State**: North/South traffic flows; East/West holds RED |
| **1** | `YELLOW` | `RED` | North/South warning to stop; East/West holds RED |
| **2** | `RED` | `RED` | **All-Red Clearance**: Intersection clears safely |
| **3** | `RED` | `YELLOW` | East/West warning/pre-clearance; North/South holds RED |
| **4** | `RED` | `GREEN` | East/West traffic flows; North/South holds RED |
| **5** | `RED` | `YELLOW` | East/West warning to stop; North/South holds RED |
| **6** | `RED` | `RED` | **All-Red Clearance**: Intersection clears safely |
| **7** | `YELLOW` | `RED` | North/South warning/pre-clearance; East/West holds RED |

*(Cycles back to Step 0)*

### Permitted Axis Transitions

State changes on each axis must transition through intermediate buffer phases:
* **RED → YELLOW → GREEN**
* **GREEN → YELLOW → RED**
* Direct **RED ↔ GREEN** transitions are strictly rejected.

### Power States
* **ON State (`INITIAL_ON_STATE`)**: Deterministically starts at Step 0 (`North/South: GREEN, East/West: RED`).
* **OFF State (`OFF_STATE`)**: Both axes are unpowered (`North/South: OFF, East/West: OFF`).

---

## Safety invariant

The state machine strictly enforces the following core safety invariants:

1. **Mutual Exclusion (No Simultaneous GREEN)**:
   `northSouth === GREEN && eastWest === GREEN` is strictly forbidden and rejected. Both intersecting axes can never have green clearance simultaneously.

2. **Facing Pair Synchronization**:
   North and South lights always display identical states, and East and West lights always display identical states, enforced by the two-axis architecture.

3. **Mandatory Transitional Buffer (No Direct RED ↔ GREEN)**:
   Direct jumps between RED and GREEN without passing through YELLOW are rejected by the transition validator.

4. **All-Red Clearance Intervals**:
   Dedicated all-red intervals (`RED` on both axes) must occur before releasing the perpendicular flow, allowing vehicles in the intersection to clear safely.

5. **Deterministic Safe Startup**:
   When transitioning from OFF to ON, the system must start in a safe operational state (`GREEN/RED` or `RED/GREEN`). Starting with `YELLOW` on either axis is rejected.

6. **Power Cohesion**:
   When the system is OFF, all lights must be OFF. Mixed states where one axis is active and the other is OFF are prohibited.

7. **Fail-Safe Pre-Validation**:
   State transitions are pre-validated before any mutation occurs. If an invalid or unsafe transition is requested, the system rejects it, logs a warning, and maintains the current safe state intact.
