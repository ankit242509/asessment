import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntersectionPosition, LightState } from '../traffic-system/traffic-system.models';
import { TrafficLightComponent } from './traffic-light.component';

describe('TrafficLightComponent', () => {
  let component: TrafficLightComponent;
  let fixture: ComponentFixture<TrafficLightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficLightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrafficLightComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.NORTH);
    fixture.componentRef.setInput('state', LightState.RED);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should display the correct position badge and axis label', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.NORTH);
    fixture.componentRef.setInput('state', LightState.RED);
    fixture.componentRef.setInput('axisLabel', 'Axis 1 — North/South');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.position-badge')?.textContent?.trim()).toBe('NORTH');
    expect(compiled.querySelector('.axis-badge')?.textContent?.trim()).toBe('Axis 1 — North/South');
  });

  it('should illuminate ONLY the RED lamp when state is RED', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.NORTH);
    fixture.componentRef.setInput('state', LightState.RED);
    fixture.detectChanges();

    expect(component.isRedActive()).toBe(true);
    expect(component.isYellowActive()).toBe(false);
    expect(component.isGreenActive()).toBe(false);
    expect(component.isOff()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lamp-red')?.classList.contains('active')).toBe(true);
    expect(compiled.querySelector('.lamp-yellow')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-green')?.classList.contains('active')).toBe(false);
  });

  it('should illuminate ONLY the YELLOW lamp when state is YELLOW', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.EAST);
    fixture.componentRef.setInput('state', LightState.YELLOW);
    fixture.detectChanges();

    expect(component.isRedActive()).toBe(false);
    expect(component.isYellowActive()).toBe(true);
    expect(component.isGreenActive()).toBe(false);
    expect(component.isOff()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lamp-red')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-yellow')?.classList.contains('active')).toBe(true);
    expect(compiled.querySelector('.lamp-green')?.classList.contains('active')).toBe(false);
  });

  it('should illuminate ONLY the GREEN lamp when state is GREEN', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.SOUTH);
    fixture.componentRef.setInput('state', LightState.GREEN);
    fixture.detectChanges();

    expect(component.isRedActive()).toBe(false);
    expect(component.isYellowActive()).toBe(false);
    expect(component.isGreenActive()).toBe(true);
    expect(component.isOff()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lamp-red')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-yellow')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-green')?.classList.contains('active')).toBe(true);
  });

  it('should leave all lamps dim and unlit when state is OFF', () => {
    fixture.componentRef.setInput('position', IntersectionPosition.WEST);
    fixture.componentRef.setInput('state', LightState.OFF);
    fixture.detectChanges();

    expect(component.isRedActive()).toBe(false);
    expect(component.isYellowActive()).toBe(false);
    expect(component.isGreenActive()).toBe(false);
    expect(component.isOff()).toBe(true);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.lamp-red')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-yellow')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.lamp-green')?.classList.contains('active')).toBe(false);
    expect(compiled.querySelector('.light-housing')?.classList.contains('housing-off')).toBe(true);
  });
});
