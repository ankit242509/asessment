import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IntersectionPosition, LightState } from '../traffic-system/traffic-system.models';

/**
 * TrafficLightComponent renders a single physical traffic light fixture.
 *
 * It is a purely presentational (dumb) standalone component:
 * - Accepts input signals for position, state, axis label, and orientation.
 * - Supports both 'vertical' (traditional post) and 'horizontal' (overhead gantry) designs.
 * - When state is OFF, all lenses remain unlit.
 * - Follows OnPush change detection strategy for optimal performance.
 */
@Component({
  selector: 'app-traffic-light',
  standalone: true,
  imports: [],
  templateUrl: './traffic-light.component.html',
  styleUrl: './traffic-light.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrafficLightComponent {
  /**
   * The physical compass position (NORTH, SOUTH, EAST, WEST).
   */
  public readonly position = input.required<IntersectionPosition>();

  /**
   * Current light state derived from the logical axis (RED, YELLOW, GREEN, OFF).
   */
  public readonly state = input.required<LightState>();

  /**
   * Descriptive label indicating the axis pair (e.g., 'Axis 1 — North/South').
   */
  public readonly axisLabel = input<string>('');

  /**
   * Visual layout orientation: 'vertical' (default) or 'horizontal'.
   * Horizontal layout is particularly suited for overhead North & South approaches.
   */
  public readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  /**
   * Computed boolean indicating if the RED lamp should illuminate.
   */
  public readonly isRedActive = computed<boolean>(() => this.state() === LightState.RED);

  /**
   * Computed boolean indicating if the YELLOW lamp should illuminate.
   */
  public readonly isYellowActive = computed<boolean>(() => this.state() === LightState.YELLOW);

  /**
   * Computed boolean indicating if the GREEN lamp should illuminate.
   */
  public readonly isGreenActive = computed<boolean>(() => this.state() === LightState.GREEN);

  /**
   * Computed boolean indicating if all lamps are unpowered.
   */
  public readonly isOff = computed<boolean>(() => this.state() === LightState.OFF);

  /**
   * Computed boolean for horizontal orientation helper.
   */
  public readonly isHorizontal = computed<boolean>(() => this.orientation() === 'horizontal');
}
