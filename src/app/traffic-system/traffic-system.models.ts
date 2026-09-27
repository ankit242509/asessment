/**
 * Light states representing the physical and logical light conditions.
 * Strongly typed enum prevents the use of magic strings across the codebase.
 */
export enum LightState {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  OFF = 'OFF',
}

/**
 * Compass directions for the physical traffic lights at the intersection.
 */
export enum IntersectionPosition {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST',
}

/**
 * Logical traffic axes in the intersection.
 * Instead of tracking four independent mutable states, the system groups
 */
export enum TrafficAxis {
  NORTH_SOUTH = 'NORTH_SOUTH',
  EAST_WEST = 'EAST_WEST',
}

/**
 * Complete logical state of the traffic system across both axes.
 */
export interface TrafficSystemState {
  readonly northSouth: LightState;
  readonly eastWest: LightState;
}

/**
 * System safety invariant status.
 */
export enum SystemSafetyStatus {
  SAFE = 'SAFE',
  UNSAFE = 'UNSAFE',
}
