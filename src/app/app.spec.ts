import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { LightState } from './traffic-system/traffic-system.models';
import { TrafficSystemService } from './traffic-system/traffic-system.service';

describe('App Component', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let trafficService: TrafficSystemService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [TrafficSystemService],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    trafficService = TestBed.inject(TrafficSystemService);
    fixture.detectChanges();
  });

  afterEach(() => {
    trafficService.stopAutoCycle();
  });

  it('should create the App component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the main title TRAFFIC LIGHT SYSTEM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('.system-title');
    expect(titleElement?.textContent).toContain('TRAFFIC LIGHT SYSTEM');
  });

  it('should render all 4 physical traffic lights (North, South, East, West)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const trafficLights = compiled.querySelectorAll('app-traffic-light');
    expect(trafficLights.length).toBe(4);

    const positions = Array.from(trafficLights).map(
      (el) => el.querySelector('.position-badge')?.textContent?.trim()
    );
    expect(positions).toContain('NORTH');
    expect(positions).toContain('SOUTH');
    expect(positions).toContain('EAST');
    expect(positions).toContain('WEST');
  });

  it('should reflect initial system power ON and SAFE status', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statusRibbon = compiled.querySelector('.status-ribbon');
    expect(statusRibbon?.textContent).toContain('System: ON');
    expect(statusRibbon?.textContent).toContain('System Status: SAFE');
  });

  it('should toggle system power when Switch OFF / Switch ON button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const powerBtn = compiled.querySelector('.btn-power') as HTMLButtonElement;

    expect(trafficService.isOn()).toBe(true);
    expect(powerBtn.textContent).toContain('Switch OFF');

    // Click to power off
    powerBtn.click();
    fixture.detectChanges();

    expect(trafficService.isOn()).toBe(false);
    expect(powerBtn.textContent).toContain('Switch ON');
    expect(trafficService.northLight()).toBe(LightState.OFF);
    expect(trafficService.southLight()).toBe(LightState.OFF);
    expect(trafficService.eastLight()).toBe(LightState.OFF);
    expect(trafficService.westLight()).toBe(LightState.OFF);

    // Click to power on
    powerBtn.click();
    fixture.detectChanges();

    expect(trafficService.isOn()).toBe(true);
    expect(trafficService.northLight()).toBe(LightState.GREEN);
    expect(trafficService.eastLight()).toBe(LightState.RED);
  });

  it('should disable Next State and Auto Cycle buttons when system is OFF', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    trafficService.turnOff();
    fixture.detectChanges();

    const stepBtn = compiled.querySelector('.btn-step') as HTMLButtonElement;
    const cycleBtn = compiled.querySelector('.btn-cycle') as HTMLButtonElement;

    expect(stepBtn.disabled).toBe(true);
    expect(cycleBtn.disabled).toBe(true);
  });

  it('should advance to the next state when Next State button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const stepBtn = compiled.querySelector('.btn-step') as HTMLButtonElement;

    expect(trafficService.currentCycleIndex()).toBe(0);
    expect(trafficService.state().northSouth).toBe(LightState.GREEN);

    stepBtn.click();
    fixture.detectChanges();

    expect(trafficService.currentCycleIndex()).toBe(1);
    expect(trafficService.state().northSouth).toBe(LightState.YELLOW);
    expect(trafficService.state().eastWest).toBe(LightState.RED);
  });

  it('should toggle auto-cycle when Auto Cycle button is clicked', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cycleBtn = compiled.querySelector('.btn-cycle') as HTMLButtonElement;

    expect(trafficService.isAutoCycling()).toBe(false);

    cycleBtn.click();
    fixture.detectChanges();
    expect(trafficService.isAutoCycling()).toBe(true);

    cycleBtn.click();
    fixture.detectChanges();
    expect(trafficService.isAutoCycling()).toBe(false);
  });

  it('should update transition interval when select option changes', () => {
    const select = fixture.nativeElement.querySelector('#interval-select') as HTMLSelectElement;
    select.value = '4000';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(trafficService.transitionIntervalMs()).toBe(4000);
  });

  it('should toggle North/South orientation between horizontal and vertical', () => {
    const orientationBtn = fixture.nativeElement.querySelector('.btn-orientation') as HTMLButtonElement;
    expect(component.northSouthOrientation()).toBe('horizontal');

    orientationBtn.click();
    fixture.detectChanges();
    expect(component.northSouthOrientation()).toBe('vertical');

    orientationBtn.click();
    fixture.detectChanges();
    expect(component.northSouthOrientation()).toBe('horizontal');
  });
});
