import { TestBed } from '@angular/core/testing';
import {
  INITIAL_ON_STATE,
  OFF_STATE,
  SAFE_TRAFFIC_CYCLE,
} from './traffic-system.constants';
import { LightState, TrafficSystemState } from './traffic-system.models';
import { TrafficSystemService } from './traffic-system.service';

describe('TrafficSystemService', () => {
  let service: TrafficSystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrafficSystemService],
    });
    service = TestBed.inject(TrafficSystemService);
  });

  describe('Initial State', () => {
    it('should initialize in the safe initial state (North/South: GREEN, East/West: RED)', () => {
      expect(service.state()).toEqual(INITIAL_ON_STATE);
      expect(service.isOn()).toBe(true);
      expect(service.isSafe()).toBe(true);
    });

    it('should never initialize or start with YELLOW', () => {
      const state = service.state();
      expect(state.northSouth).not.toBe(LightState.YELLOW);
      expect(state.eastWest).not.toBe(LightState.YELLOW);
    });
  });

  describe('Startup & Shutdown (Section 19)', () => {
    it('should result in OFF/OFF when system is switched OFF', () => {
      expect(service.isOn()).toBe(true);
      const turnedOff = service.turnOff();

      expect(turnedOff).toBe(true);
      expect(service.state()).toEqual(OFF_STATE);
      expect(service.state().northSouth).toBe(LightState.OFF);
      expect(service.state().eastWest).toBe(LightState.OFF);
      expect(service.isOn()).toBe(false);
      expect(service.isSafe()).toBe(true);
    });

    it('should result in RED/GREEN or GREEN/RED (and never YELLOW) when switching from OFF to ON', () => {
      service.turnOff();
      expect(service.isOn()).toBe(false);

      const turnedOn = service.turnOn();
      expect(turnedOn).toBe(true);
      expect(service.isOn()).toBe(true);

      const current = service.state();
      // Must be GREEN/RED or RED/GREEN
      const isExpectedStartup =
        (current.northSouth === LightState.GREEN && current.eastWest === LightState.RED) ||
        (current.northSouth === LightState.RED && current.eastWest === LightState.GREEN);

      expect(isExpectedStartup).toBe(true);
      expect(current.northSouth).not.toBe(LightState.YELLOW);
      expect(current.eastWest).not.toBe(LightState.YELLOW);
    });

    it('should reject startup transitions attempting to begin with YELLOW', () => {
      service.turnOff();

      const invalidStartupYellowNS: TrafficSystemState = {
        northSouth: LightState.YELLOW,
        eastWest: LightState.RED,
      };
      const invalidStartupYellowEW: TrafficSystemState = {
        northSouth: LightState.RED,
        eastWest: LightState.YELLOW,
      };

      expect(service.isValidTransition(OFF_STATE, invalidStartupYellowNS)).toBe(false);
      expect(service.isValidTransition(OFF_STATE, invalidStartupYellowEW)).toBe(false);

      // Attempt transition directly
      const success = service.requestTransition(invalidStartupYellowNS);
      expect(success).toBe(false);
      expect(service.state()).toEqual(OFF_STATE); // State remains safely OFF
    });

    it('should toggle power between ON and OFF correctly', () => {
      expect(service.isOn()).toBe(true);

      service.togglePower();
      expect(service.isOn()).toBe(false);
      expect(service.state()).toEqual(OFF_STATE);

      service.togglePower();
      expect(service.isOn()).toBe(true);
      expect(service.state()).toEqual(INITIAL_ON_STATE);
    });
  });

  describe('Pair Synchronization (Section 10 & 19)', () => {
    it('should guarantee North === South at all times via computed signals', () => {
      // Test initial state
      expect(service.northLight()).toBe(service.southLight());

      // Test across every step in the safe cycle
      for (const cycleState of SAFE_TRAFFIC_CYCLE) {
        service.requestTransition(cycleState);
        expect(service.northLight()).toBe(service.southLight());
        expect(service.northLight()).toBe(cycleState.northSouth);
      }

      // Test OFF state
      service.turnOff();
      expect(service.northLight()).toBe(LightState.OFF);
      expect(service.southLight()).toBe(LightState.OFF);
      expect(service.northLight()).toBe(service.southLight());
    });

    it('should guarantee East === West at all times via computed signals', () => {
      // Test initial state
      expect(service.eastLight()).toBe(service.westLight());

      // Test across every step in the safe cycle
      for (const cycleState of SAFE_TRAFFIC_CYCLE) {
        service.requestTransition(cycleState);
        expect(service.eastLight()).toBe(service.westLight());
        expect(service.eastLight()).toBe(cycleState.eastWest);
      }

      // Test OFF state
      service.turnOff();
      expect(service.eastLight()).toBe(LightState.OFF);
      expect(service.westLight()).toBe(LightState.OFF);
      expect(service.eastLight()).toBe(service.westLight());
    });
  });

  describe('Safety Invariant — Simultaneous GREEN Rejection (Section 5 & 19)', () => {
    it('should reject any state where both North/South and East/West are GREEN simultaneously', () => {
      const greenGreenState: TrafficSystemState = {
        northSouth: LightState.GREEN,
        eastWest: LightState.GREEN,
      };

      expect(service.isSafeState(greenGreenState)).toBe(false);
      expect(service.isValidTransition(service.state(), greenGreenState)).toBe(false);

      const transitionResult = service.requestTransition(greenGreenState);
      expect(transitionResult).toBe(false);
      expect(service.state()).not.toEqual(greenGreenState);
      expect(service.state()).toEqual(INITIAL_ON_STATE);
    });

    it('should reject mixed ON/OFF states where one axis is OFF and the other is active', () => {
      const mixedState1: TrafficSystemState = {
        northSouth: LightState.GREEN,
        eastWest: LightState.OFF,
      };
      const mixedState2: TrafficSystemState = {
        northSouth: LightState.OFF,
        eastWest: LightState.RED,
      };

      expect(service.isSafeState(mixedState1)).toBe(false);
      expect(service.isSafeState(mixedState2)).toBe(false);
      expect(service.requestTransition(mixedState1)).toBe(false);
      expect(service.requestTransition(mixedState2)).toBe(false);
    });
  });

  describe('Axis Transition Validation (Section 4, 9, 19)', () => {
    it('should reject direct RED -> GREEN transition', () => {
      expect(service.isValidAxisTransition(LightState.RED, LightState.GREEN)).toBe(false);
    });

    it('should reject direct GREEN -> RED transition', () => {
      expect(service.isValidAxisTransition(LightState.GREEN, LightState.RED)).toBe(false);
    });

    it('should accept RED -> YELLOW transition', () => {
      expect(service.isValidAxisTransition(LightState.RED, LightState.YELLOW)).toBe(true);
    });

    it('should accept YELLOW -> GREEN transition', () => {
      expect(service.isValidAxisTransition(LightState.YELLOW, LightState.GREEN)).toBe(true);
    });

    it('should accept GREEN -> YELLOW transition', () => {
      expect(service.isValidAxisTransition(LightState.GREEN, LightState.YELLOW)).toBe(true);
    });

    it('should accept YELLOW -> RED transition', () => {
      expect(service.isValidAxisTransition(LightState.YELLOW, LightState.RED)).toBe(true);
    });

    it('should allow axis state to remain unchanged', () => {
      expect(service.isValidAxisTransition(LightState.RED, LightState.RED)).toBe(true);
      expect(service.isValidAxisTransition(LightState.YELLOW, LightState.YELLOW)).toBe(true);
      expect(service.isValidAxisTransition(LightState.GREEN, LightState.GREEN)).toBe(true);
    });
  });

  describe('Safety-First Policy (Section 20)', () => {
    it('should not mutate the state when an invalid transition is attempted', () => {
      const initialState = service.state();
      const forbiddenState: TrafficSystemState = {
        northSouth: LightState.GREEN,
        eastWest: LightState.GREEN,
      };

      const result = service.requestTransition(forbiddenState);

      expect(result).toBe(false);
      expect(service.state()).toEqual(initialState);
      expect(service.isSafe()).toBe(true);
    });

    it('should not mutate state if a direct RED -> GREEN transition is attempted on one axis', () => {
      // Current state: NS: GREEN, EW: RED
      const invalidJump: TrafficSystemState = {
        northSouth: LightState.GREEN,
        eastWest: LightState.GREEN, // Direct RED -> GREEN on East/West AND double green!
      };

      const result = service.requestTransition(invalidJump);
      expect(result).toBe(false);
      expect(service.state()).toEqual(INITIAL_ON_STATE);
    });
  });

  describe('Full Cycle Execution (Section 7 & 19)', () => {
    it('should ensure the complete recommended traffic cycle contains NO invalid states', () => {
      for (let i = 0; i < SAFE_TRAFFIC_CYCLE.length; i++) {
        const state = SAFE_TRAFFIC_CYCLE[i];
        expect(service.isSafeState(state)).toBe(true);
        expect(state.northSouth === LightState.GREEN && state.eastWest === LightState.GREEN).toBe(
          false
        );
      }
    });

    it('should ensure every transition in the cycle strictly passes isValidTransition', () => {
      for (let i = 0; i < SAFE_TRAFFIC_CYCLE.length; i++) {
        const current = SAFE_TRAFFIC_CYCLE[i];
        const next = SAFE_TRAFFIC_CYCLE[(i + 1) % SAFE_TRAFFIC_CYCLE.length];

        const valid = service.isValidTransition(current, next);
        expect(valid, `Transition from step ${i} to step ${(i + 1) % SAFE_TRAFFIC_CYCLE.length} must be valid`).toBe(true);
      }
    });

    it('should advance smoothly through the entire cycle using nextState()', () => {
      expect(service.currentCycleIndex()).toBe(0);
      expect(service.state()).toEqual(SAFE_TRAFFIC_CYCLE[0]);

      for (let i = 1; i < SAFE_TRAFFIC_CYCLE.length; i++) {
        const success = service.nextState();
        expect(success).toBe(true);
        expect(service.currentCycleIndex()).toBe(i);
        expect(service.state()).toEqual(SAFE_TRAFFIC_CYCLE[i]);
      }

      // Advance one more time to loop back to 0
      const looped = service.nextState();
      expect(looped).toBe(true);
      expect(service.currentCycleIndex()).toBe(0);
      expect(service.state()).toEqual(SAFE_TRAFFIC_CYCLE[0]);
    });
  });
});

