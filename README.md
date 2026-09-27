# Traffic Light System — Angular 21 Technical Assessment

A robust, safety-first, standalone **Traffic Light System** built in **Angular 21** adhering to strict state-machine modeling, invariant verification, and modern reactive Angular patterns.

---

## 1. Overview

This application simulates a real-world four-way intersection with four physical traffic lights:
* **North** and **South** (facing pair)
* **East** and **West** (facing pair)

The primary focus of this assessment is **correct state management**, **prevention of invalid states**, **fail-safe execution**, and **clean separation of concerns** between business logic and UI presentation. No external UI or state-management libraries (such as Angular Material, Bootstrap, Tailwind, or NgRx) are used—only native Angular 21 Standalone Components, Angular Signals, TypeScript, HTML, and CSS.

---

## 2. Architecture & Separation of Concerns

The solution adheres to a strict unidirectional data flow and multi-tiered safety architecture:

```text
                  +--------------------------------+
                  |         User Interface         |
                  |  (App & TrafficLightComponent) |
                  +---------------+----------------+
                                  |
               User Action Triggers / Signal Reads
                                  |
                                  v
                  +--------------------------------+
                  |     TrafficSystemService       |
                  |        (State Machine)         |
                  +---------------+----------------+
                                  |
               requestTransition(nextState) Pre-Check
                                  |
                                  v
                  +--------------------------------+
                  |    Safety Validation Engine    |
                  | - isSafeState()                |
                  | - isValidTransition()          |
                  | - isValidAxisTransition()      |
                  +---------------+----------------+
                                  |
                        Valid?    |
                       +----------+----------+
                       |                     |
                      YES                   NO
                       |                     |
                       v                     v
            Apply State Signal Mutation   Reject Transition
            (state.set(nextState))        (Log warning, state remains safe)
```

1. **Presentation Layer (`src/app/traffic-light/`, `src/app/app.ts`)**:
   - Pure UI components using `ChangeDetectionStrategy.OnPush`.
   - Render the physical fixtures (lenses, visors, glowing illumination) and road markings.
   - Display real-time telemetry (active phase, power status, invariant verification status).
   - Trigger user commands (`turnOn()`, `turnOff()`, `nextState()`, `toggleAutoCycle()`).

2. **State Management & State Machine (`src/app/traffic-system/traffic-system.service.ts`)**:
   - Central authority of application truth using Angular Signals (`signal<TrafficSystemState>`).
   - Controls lifecycle, timers, and transitions.
   - Houses computed signals for each physical light: `northLight`, `southLight`, `eastLight`, `westLight`.

3. **Validation & Invariant Safety (`TrafficSystemService.isValidTransition`)**:
   - Enforces the **Safety-First Principle**: Validation executes **before** state mutation.
   - Unsafe requests are rejected immediately, preserving the current valid state without glitching.

---

## 3. State Model: Two Logical Axes vs Four Independent Variables

### Why Two Logical Axes?

A naive approach might store four independent mutable states:
```typescript
// ❌ Flawed / Bug-Prone Approach:
north: LightState;
south: LightState;
east: LightState;
west: LightState;
```
This flawed design yields $4^4 = 256$ state combinations, where almost all are dangerous or out-of-sync (e.g. North=GREEN while South=RED).

### The Solution: Two Orthogonal Logical Axes

```typescript
// ✅ Safe-by-Design Model:
export interface TrafficSystemState {
  readonly northSouth: LightState;
  readonly eastWest: LightState;
}
```

The system models the intersection as **two orthogonal axes**:
1. `northSouth` (Axis 1)
2. `eastWest` (Axis 2)

Each physical light derives its displayed state directly from its parent axis via computed signals:
```typescript
readonly northLight = computed(() => this._state().northSouth);
readonly southLight = computed(() => this._state().northSouth);
readonly eastLight  = computed(() => this._state().eastWest);
readonly westLight  = computed(() => this._state().eastWest);
```

### Key Advantage
It is **structurally impossible** for North and South (or East and West) to disagree. Pair synchronization is guaranteed at the architectural level rather than relying on error-prone UI checks.

---

## 4. Safety Rules & Invariants Enforced

The system strictly enforces the following eight core safety rules:

1. **Paired Lights Synchronization**: North & South always match; East & West always match (enforced by the axis model).
2. **Mutual Exclusion (No Simultaneous GREEN)**: `northSouth === GREEN && eastWest === GREEN` is strictly forbidden and rejected.
3. **No Direct RED → GREEN**: Traffic on an axis cannot jump straight to GREEN without entering the transitional YELLOW phase first.
4. **No Direct GREEN → RED**: Traffic on an axis cannot instantly stop without entering the warning YELLOW phase first.
5. **Transitional YELLOW**: YELLOW is strictly a warning and transition state between RED and GREEN.
6. **All-Inclusive OFF State**: When the system is OFF, all four physical lights must be dark (`northSouth === OFF && eastWest === OFF`). Mixed ON/OFF combinations are invalid.
7. **Deterministic Safe Startup**: When powered ON from OFF, the system begins deterministically at `North/South: GREEN, East/West: RED` (`INITIAL_ON_STATE`). Startup directly into YELLOW is strictly rejected.
8. **Clearance Phases (All-Red)**: The operating cycle contains dedicated clearance intervals where both axes are RED before granting GREEN to the cross axis.

---

## 5. Recommended Safe Operating Cycle

The application implements the predictable 8-phase cycle:

| Step | North/South | East/West | Description |
|:---:|:---:|:---:|:---|
| **0** | `GREEN` | `RED` | **Initial State**: North/South traffic flows; East/West holds |
| **1** | `YELLOW` | `RED` | North/South warning to stop; East/West holds |
| **2** | `RED` | `RED` | **All-Red Clearance**: Intersection clears safely |
| **3** | `RED` | `YELLOW` | East/West signals upcoming release; North/South holds |
| **4** | `RED` | `GREEN` | East/West traffic flows; North/South holds |
| **5** | `RED` | `YELLOW` | East/West warning to stop; North/South holds |
| **6** | `RED` | `RED` | **All-Red Clearance**: Intersection clears safely |
| **7** | `YELLOW` | `RED` | North/South signals upcoming release; East/West holds |

*(Repeats back to Step 0)*

---

## 6. Project Structure

```text
src/
├── app/
│   ├── traffic-light/                         # Standalone presentational component
│   │   ├── traffic-light.component.ts         # Component logic, signal inputs, computed states
│   │   ├── traffic-light.component.html       # Hooded lamp fixtures, lenses, and accessibility
│   │   ├── traffic-light.component.css        # Pure CSS housing, reflection, and glow optics
│   │   └── traffic-light.component.spec.ts    # Unit tests for visual light states
│   │
│   ├── traffic-system/                        # State machine and business logic
│   │   ├── traffic-system.models.ts           # Strongly typed enums & interfaces
│   │   ├── traffic-system.constants.ts        # OFF_STATE, INITIAL_ON_STATE, SAFE_TRAFFIC_CYCLE
│   │   ├── traffic-system.service.ts          # State machine, signal stores, invariant validation
│   │   └── traffic-system.service.spec.ts     # 25 thorough unit tests for all safety rules
│   │
│   ├── app.ts                                 # Root orchestrator component
│   ├── app.html                               # Intersection view, dashboard controls, telemetry
│   ├── app.css                                # Layout, asphalt crossroad, crosswalk markings
│   └── app.spec.ts                            # Integration tests for UI and user actions
│
├── styles.css                                 # Global CSS baseline & typography
└── main.ts                                    # Application bootstrap
```

---

## 7. Running the Project

### Prerequisites
* Node.js v20+
* npm v10+

### Installation
```bash
npm install
```

### Start Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/` in your browser.

### Run Unit Tests
```bash
npm test
```
Runs the complete test suite (42 unit tests) using Angular 21's built-in Vitest runner:
```bash
npm test -- --watch=false
```

### Production Build
```bash
npm run build
```

---

## 8. Design Decisions & Highlights

1. **North & South Light Design**: North and South approaches support an authentic horizontal overhead gantry design (`[ RED | YELLOW | GREEN ]`) alongside the traditional vertical post design. This prevents vertical crowding across the crossroad, completely eliminates occlusion of the header and footer pills, and provides natural spatial alignment across the 4-way intersection.
2. **Angular Signals**: State is represented via `signal<TrafficSystemState>`, and individual lights are derived using `computed()`. This ensures zero manual change-detection gymnastics and optimal rendering performance with `OnPush`.
3. **Immutability**: `OFF_STATE`, `INITIAL_ON_STATE`, and `SAFE_TRAFFIC_CYCLE` are deeply frozen with `Object.freeze()` to prevent runtime tampering.
4. **Timer Safety**: Automatic cycling interval timers are automatically cleared on `turnOff()`, when starting a new cycle, and on service `ngOnDestroy()`. This guarantees no memory leaks or duplicate overlapping intervals.
5. **Safety-First Dispatcher**: The `requestTransition()` method checks `isValidTransition()` *before* modifying state. If invalid, a warning is logged and the existing valid state is left completely intact.
6. **No External Component Libraries**: 100% native HTML and CSS used for the hooded traffic lights, glow illumination, crossroad markings, and dashboard cards.
