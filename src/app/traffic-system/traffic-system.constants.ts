import { LightState, TrafficSystemState } from './traffic-system.models';

/**
 * Valid system state when powered OFF.
 */
export const OFF_STATE: Readonly<TrafficSystemState> = Object.freeze({
  northSouth: LightState.OFF,
  eastWest: LightState.OFF,
});

/**
 * Deterministic initial state when the system is switched ON.
 */
export const INITIAL_ON_STATE: Readonly<TrafficSystemState> = Object.freeze({
  northSouth: LightState.GREEN,
  eastWest: LightState.RED,
});

/**
 * Recommended Safe Operating Cycle (Section 7).
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

