import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TrafficLightComponent } from './traffic-light/traffic-light.component';
import {
  SAFE_TRAFFIC_CYCLE,
} from './traffic-system/traffic-system.constants';
import {
  IntersectionPosition,
  LightState,
} from './traffic-system/traffic-system.models';
import { TrafficSystemService } from './traffic-system/traffic-system.service';

/**
 * Root Application Component for the Traffic Light System Assessment.
 *
 * Responsibilities:
 * - Pure UI orchestration layer.
 * - Delegates all state transitions and safety evaluations to TrafficSystemService.
 * - Renders the physical intersection with 4 lights derived from 2 logical axes.
 * - Displays controls and real-time safety telemetry.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TrafficLightComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /**
   * Injected state-management service containing all business logic and invariants.
   */
  public readonly trafficService = inject(TrafficSystemService);

  /**
   * Position constants exposed for template binding.
   */
  public readonly Position = IntersectionPosition;

  /**
   * Current cycle total count.
   */
  public readonly totalCycleSteps = SAFE_TRAFFIC_CYCLE.length;

  /**
   * Human-readable description of current cycle phase.
   */
  public readonly phaseDescription = computed<string>(() => {
    if (!this.trafficService.isOn()) {
      return 'System Powered OFF (All axes inactive)';
    }

    const index = this.trafficService.currentCycleIndex();
    const state = this.trafficService.state();

    if (state.northSouth === LightState.GREEN && state.eastWest === LightState.RED) {
      return `Phase ${index + 1}: North/South Green Clearance (East/West Holding RED)`;
    }
    if (state.northSouth === LightState.YELLOW && state.eastWest === LightState.RED) {
      return `Phase ${index + 1}: North/South Yellow Warning (East/West Holding RED)`;
    }
    if (state.northSouth === LightState.RED && state.eastWest === LightState.RED) {
      return `Phase ${index + 1}: All-Red Clearance Interval (Intersection Clearing)`;
    }
    if (state.northSouth === LightState.RED && state.eastWest === LightState.YELLOW) {
      return `Phase ${index + 1}: East/West Yellow Warning (North/South Holding RED)`;
    }
    if (state.northSouth === LightState.RED && state.eastWest === LightState.GREEN) {
      return `Phase ${index + 1}: East/West Green Clearance (North/South Holding RED)`;
    }

    return `Phase ${index + 1}: Safe Transition Interval`;
  });

  /**
   * Verification check that simultaneous green invariant is currently satisfied.
   */
  public readonly isSimultaneousGreenPrevented = computed<boolean>(() => {
    const s = this.trafficService.state();
    return !(s.northSouth === LightState.GREEN && s.eastWest === LightState.GREEN);
  });

  /**
   * Verification check that North and South lights are strictly synchronized.
   */
  public readonly isNorthSouthSynchronized = computed<boolean>(() => {
    return this.trafficService.northLight() === this.trafficService.southLight();
  });

  /**
   * Verification check that East and West lights are strictly synchronized.
   */
  public readonly isEastWestSynchronized = computed<boolean>(() => {
    return this.trafficService.eastLight() === this.trafficService.westLight();
  });

  /**
   * Visual layout design for North & South lights: 'horizontal' (overhead gantry) or 'vertical' (traditional post).
   * Defaults to 'horizontal' to provide optimal spatial balance across the intersection.
   */
  public readonly northSouthOrientation = signal<'horizontal' | 'vertical'>('horizontal');

  public toggleNorthSouthOrientation(): void {
    this.northSouthOrientation.update((current: 'horizontal' | 'vertical') =>
      current === 'horizontal' ? 'vertical' : 'horizontal'
    );
  }

  // --- UI Action Handlers ---

  public onTogglePower(): void {
    this.trafficService.togglePower();
  }

  public onNextState(): void {
    this.trafficService.nextState();
  }

  public onToggleAutoCycle(): void {
    this.trafficService.toggleAutoCycle();
  }

  public onSelectInterval(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const intervalMs = parseInt(select.value, 10);
    if (!isNaN(intervalMs)) {
      this.trafficService.setTransitionInterval(intervalMs);
    }
  }
}
