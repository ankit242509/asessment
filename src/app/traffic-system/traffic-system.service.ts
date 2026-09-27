import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import {
  DEFAULT_TRANSITION_INTERVAL_MS,
  INITIAL_ON_STATE,
  OFF_STATE,
  SAFE_TRAFFIC_CYCLE,
} from './traffic-system.constants';
import { LightState, TrafficSystemState } from './traffic-system.models';

/**
 * TrafficSystemService acts as the central State Machine and Safety Guardian.
 *
 * Design Principles:
 * 1. Single Responsibility: Houses all traffic rules, safety validations, and transitions.
 * 2. Pre-Validation Enforcement: Never updates internal state unless the requested transition passes all invariants.
 * 3. Prevention Over Detection: Manages paired directions as logical axes (northSouth / eastWest)
 *    so opposite lights cannot physically disagree.
 * 4. Reactive State: Uses Angular Signals for fine-grained reactivity and computed physical states.
 */
@Injectable({
  providedIn: 'root',
})
export class TrafficSystemService implements OnDestroy {
  /**
   * Internal mutable state signal initialized to the safe initial state (NS=GREEN, EW=RED).
   */
  private readonly _state = signal<TrafficSystemState>(INITIAL_ON_STATE);

  /**
   * Public readonly state signal.
   */
  public readonly state = this._state.asReadonly();

  /**
   * Current position index in SAFE_TRAFFIC_CYCLE.
   */
  private readonly _currentCycleIndex = signal<number>(0);
  public readonly currentCycleIndex = this._currentCycleIndex.asReadonly();

  /**
   * Automatic cycling status signal.
   */
  private readonly _isAutoCycling = signal<boolean>(false);
  public readonly isAutoCycling = this._isAutoCycling.asReadonly();

  /**
   * Configurable transition interval in milliseconds.
   */
  private readonly _transitionIntervalMs = signal<number>(DEFAULT_TRANSITION_INTERVAL_MS);
  public readonly transitionIntervalMs = this._transitionIntervalMs.asReadonly();

  /**
   * Active timer reference for automatic cycle.
   */
  private timerId: ReturnType<typeof setInterval> | null = null;

  // --- Computed Signals for UI and Physical Light Derivations ---

  /**
   * Indicates whether the traffic system is currently powered ON.
   */
  public readonly isOn = computed<boolean>(() => {
    const s = this._state();
    return s.northSouth !== LightState.OFF && s.eastWest !== LightState.OFF;
  });

  /**
   * Dynamic invariant check ensuring the active state satisfies all safety rules.
   */
  public readonly isSafe = computed<boolean>(() => {
    return this.isSafeState(this._state());
  });

  /**
   * Physical North light derived from the North/South axis.
   */
  public readonly northLight = computed<LightState>(() => this._state().northSouth);

  /**
   * Physical South light derived from the North/South axis.
   * Structurally guaranteed to equal North.
   */
  public readonly southLight = computed<LightState>(() => this._state().northSouth);

  /**
   * Physical East light derived from the East/West axis.
   */
  public readonly eastLight = computed<LightState>(() => this._state().eastWest);

  /**
   * Physical West light derived from the East/West axis.
   * Structurally guaranteed to equal East.
   */
  public readonly westLight = computed<LightState>(() => this._state().eastWest);

  // --- Lifecycle Hook ---

  public ngOnDestroy(): void {
    this.stopAutoCycle();
  }

  // --- Public State Transition Methods ---

  /**
   * Powers the system ON to the deterministic INITIAL_ON_STATE.
   * Fails safely if current state cannot transition.
   */
  public turnOn(): boolean {
    const success = this.requestTransition(INITIAL_ON_STATE);
    if (success) {
      this._currentCycleIndex.set(0);
    }
    return success;
  }

  /**
   * Powers the system OFF to the safe OFF_STATE.
   * Automatically stops any running auto-cycle.
   */
  public turnOff(): boolean {
    this.stopAutoCycle();
    return this.requestTransition(OFF_STATE);
  }

  /**
   * Toggles system power between ON and OFF.
   */
  public togglePower(): boolean {
    return this.isOn() ? this.turnOff() : this.turnOn();
  }

  /**
   * Steps the state machine to the next valid state in the safe operating cycle.
   * If the system is OFF, stepping powers it ON to the initial state.
   */
  public nextState(): boolean {
    if (!this.isOn()) {
      return this.turnOn();
    }

    const nextIndex = (this._currentCycleIndex() + 1) % SAFE_TRAFFIC_CYCLE.length;
    const targetState = SAFE_TRAFFIC_CYCLE[nextIndex];

    const success = this.requestTransition(targetState);
    if (success) {
      this._currentCycleIndex.set(nextIndex);
    }
    return success;
  }

  /**
   * Starts automatic cycling through the safe state machine sequence.
   * Cleans up any existing interval before starting to prevent duplicate timers.
   */
  public startAutoCycle(intervalMs?: number): void {
    if (intervalMs && intervalMs > 0) {
      this._transitionIntervalMs.set(intervalMs);
    }

    // Ensure system is ON before auto-cycling
    if (!this.isOn()) {
      const turnedOn = this.turnOn();
      if (!turnedOn) return;
    }

    this.stopAutoCycle(); // Clean up existing timer if any
    this._isAutoCycling.set(true);

    this.timerId = setInterval(() => {
      this.nextState();
    }, this._transitionIntervalMs());
  }

  /**
   * Stops the automatic cycle timer.
   */
  public stopAutoCycle(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this._isAutoCycling.set(false);
  }

  /**
   * Toggles the automatic cycle on or off.
   */
  public toggleAutoCycle(): void {
    if (this._isAutoCycling()) {
      this.stopAutoCycle();
    } else {
      this.startAutoCycle();
    }
  }

  /**
   * Updates the transition interval and restarts timer if actively running.
   */
  public setTransitionInterval(ms: number): void {
    if (ms < 500) return;
    this._transitionIntervalMs.set(ms);
    if (this._isAutoCycling()) {
      this.startAutoCycle(ms);
    }
  }

  /**
   * The central transition dispatcher.
   * Enforces the Safety-First invariant: Validation occurs BEFORE state mutation.
   * If invalid, the state remains completely untouched.
   */
  public requestTransition(nextState: TrafficSystemState): boolean {
    const currentState = this._state();

    if (!this.isValidTransition(currentState, nextState)) {
      console.warn(
        `[TrafficSystemService] Transition REJECTED: unsafe move from ` +
          `NS=${currentState.northSouth}, EW=${currentState.eastWest} to ` +
          `NS=${nextState.northSouth}, EW=${nextState.eastWest}.`
      );
      return false;
    }

    // Apply the valid transition safely
    this._state.set(nextState);

    // Keep cycle index in sync if nextState matches a known cycle state
    const matchedIndex = SAFE_TRAFFIC_CYCLE.findIndex(
      (c) => c.northSouth === nextState.northSouth && c.eastWest === nextState.eastWest
    );
    if (matchedIndex !== -1) {
      this._currentCycleIndex.set(matchedIndex);
    }

    return true;
  }

  // --- Pure Safety & Validation Logic ---

  /**
   * Validates whether a given static state satisfies all intersection invariants.
   *
   * Invariants checked:
   * 1. Mutual Exclusion: Both axes can NEVER be GREEN at the same time.
   * 2. System Power Cohesion: One axis cannot be OFF while the other is active.
   */
  public isSafeState(state: TrafficSystemState): boolean {
    if (!state) return false;

    // Rule 2: Both axes cannot be GREEN simultaneously
    if (state.northSouth === LightState.GREEN && state.eastWest === LightState.GREEN) {
      return false;
    }

    // Rule 6: ON + OFF axis combination is INVALID
    const isNorthSouthOff = state.northSouth === LightState.OFF;
    const isEastWestOff = state.eastWest === LightState.OFF;
    if (isNorthSouthOff !== isEastWestOff) {
      return false;
    }

    return true;
  }

  /**
   * Validates whether moving from currentState to nextState is permitted and safe.
   *
   * Validations enforced:
   * 1. Target state must be an intrinsically safe state (Rule 2 & 6).
   * 2. Shutdown: Transitioning to OFF_STATE (both OFF) is always permitted.
   * 3. Startup: Transitioning from OFF_STATE requires:
   *    - Neither axis starts on YELLOW (Rule 7).
   *    - Starts on a valid operational combination (RED/GREEN or GREEN/RED).
   * 4. Operational Transitions:
   *    - Direct RED -> GREEN is rejected (Rule 3).
   *    - Direct GREEN -> RED is rejected (Rule 4).
   *    - Every axis transition must follow RED -> YELLOW -> GREEN or GREEN -> YELLOW -> RED (Rule 5).
   */
  public isValidTransition(
    currentState: TrafficSystemState,
    nextState: TrafficSystemState
  ): boolean {
    // Both states must satisfy system-wide invariants
    if (!this.isSafeState(currentState) || !this.isSafeState(nextState)) {
      return false;
    }

    const isCurrentOff =
      currentState.northSouth === LightState.OFF && currentState.eastWest === LightState.OFF;
    const isNextOff =
      nextState.northSouth === LightState.OFF && nextState.eastWest === LightState.OFF;

    // Case 1: Transitioning to OFF (System Shutdown)
    if (isNextOff) {
      return true; // Always allow safe power-down
    }

    // Case 2: Transitioning from OFF (System Startup)
    if (isCurrentOff) {
      // Rule 7: Startup cannot begin with YELLOW on either axis
      if (
        nextState.northSouth === LightState.YELLOW ||
        nextState.eastWest === LightState.YELLOW
      ) {
        return false;
      }

      // Startup must be RED/GREEN or GREEN/RED
      const isValidStartupPair =
        (nextState.northSouth === LightState.GREEN && nextState.eastWest === LightState.RED) ||
        (nextState.northSouth === LightState.RED && nextState.eastWest === LightState.GREEN);

      return isValidStartupPair;
    }

    // Case 3: Operational Axis Transitions
    // Check transition for North/South axis
    if (!this.isValidAxisTransition(currentState.northSouth, nextState.northSouth)) {
      return false;
    }

    // Check transition for East/West axis
    if (!this.isValidAxisTransition(currentState.eastWest, nextState.eastWest)) {
      return false;
    }

    return true;
  }

  /**
   * Validates state change for an individual axis.
   * Enforces:
   * - RED -> GREEN rejected (Rule 3)
   * - GREEN -> RED rejected (Rule 4)
   * - YELLOW is strictly transitional between RED and GREEN (Rule 5)
   */
  public isValidAxisTransition(current: LightState, next: LightState): boolean {
    // Unchanged state is valid
    if (current === next) {
      return true;
    }

    // Disallow switching to/from OFF inside individual axis operational transitions
    if (current === LightState.OFF || next === LightState.OFF) {
      return false;
    }

    // Direct transitions bypassing YELLOW are strictly rejected
    if (current === LightState.RED && next === LightState.GREEN) {
      return false; // Rule 3
    }

    if (current === LightState.GREEN && next === LightState.RED) {
      return false; // Rule 4
    }

    // Valid transitional routes:
    // RED -> YELLOW -> GREEN
    // GREEN -> YELLOW -> RED
    switch (current) {
      case LightState.RED:
        return next === LightState.YELLOW;
      case LightState.GREEN:
        return next === LightState.YELLOW;
      case LightState.YELLOW:
        return next === LightState.RED || next === LightState.GREEN;
      default:
        return false;
    }
  }
}
