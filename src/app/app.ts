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
   * Injected state-management service containing all business logic.
   */
  public readonly trafficService = inject(TrafficSystemService);

  /**
   * Position constants exposed for template binding.
   */
  public readonly Position = IntersectionPosition;

  // --- UI Action Handlers ---

  public onTogglePower(): void {
    this.trafficService.togglePower();
  }

  public onNextState(): void {
    this.trafficService.nextState();
  }
}

