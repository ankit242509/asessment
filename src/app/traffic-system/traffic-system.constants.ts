import { LightState, TrafficSystemState } from './traffic-system.models';

/**
 * Valid system state when powered OFF.
 * Both logical axes (and consequently all four physical lights) are OFF.
 */
export const OFF_STATE: Readonly<TrafficSystemState> = Object.freeze({
  northSouth: LightState.OFF,
  eastWest: LightState.OFF,
});

/**
 * Deterministic initial state when the system is switched ON.
 *
 * Choice: Option 1 (North/South = GREEN, East/West = RED).
 * Rationale:
 * 1. Guarantees safe startup without any ambiguous or transitional YELLOW state.
 * 2. Directly anchors the entry point of the standard safe operating cycle (Section 7).
 * 3. Enforces that only one axis has clearance while the perpendicular axis waits on RED.
 */
export const INITIAL_ON_STATE: Readonly<TrafficSystemState> = Object.freeze({
  northSouth: LightState.GREEN,
  eastWest: LightState.RED,
});

/**
 * Recommended Safe Operating Cycle (Section 7).
 *
 * Guaranteed Safety Invariants at every stage:
 * 1. GREEN + GREEN is impossible.
 * 2. Any RED <-> GREEN transition strictly passes through YELLOW.
 * 3. Paired lights are identical because physical lights derive directly from axis state.
 * 4. Includes all-red clearance intervals (States 2 and 6) where both axes are RED
 *    before releasing the crossing axis.
 */
export const SAFE_TRAFFIC_CYCLE: ReadonlyArray<Readonly<TrafficSystemState>> = Object.freeze([
  // Phase 0: North/South flows GREEN, East/West stopped RED
  Object.freeze({ northSouth: LightState.GREEN, eastWest: LightState.RED }),

  // Phase 1: North/South prepares to stop via YELLOW, East/West remains RED
  Object.freeze({ northSouth: LightState.YELLOW, eastWest: LightState.RED }),

  // Phase 2: All-red clearance interval (North/South RED, East/West RED)
  Object.freeze({ northSouth: LightState.RED, eastWest: LightState.RED }),

  // Phase 3: East/West signals upcoming green via YELLOW, North/South remains RED
  Object.freeze({ northSouth: LightState.RED, eastWest: LightState.YELLOW }),

  // Phase 4: East/West flows GREEN, North/South stopped RED
  Object.freeze({ northSouth: LightState.RED, eastWest: LightState.GREEN }),

  // Phase 5: East/West prepares to stop via YELLOW, North/South remains RED
  Object.freeze({ northSouth: LightState.RED, eastWest: LightState.YELLOW }),

  // Phase 6: All-red clearance interval (North/South RED, East/West RED)
  Object.freeze({ northSouth: LightState.RED, eastWest: LightState.RED }),

  // Phase 7: North/South signals upcoming green via YELLOW, East/West remains RED
  Object.freeze({ northSouth: LightState.YELLOW, eastWest: LightState.RED }),
]);

/**
 * Default automatic cycle step duration in milliseconds.
 */
export const DEFAULT_TRANSITION_INTERVAL_MS = 2500;
