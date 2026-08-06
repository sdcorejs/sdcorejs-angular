import { TestBed } from '@angular/core/testing';
import { DataStateDemoComponent } from './data-state-demo.component';

describe('DataStateDemoComponent', () => {
  it('renders all five states and wires custom, retry, action and transparent success examples', async () => {
    await TestBed.configureTestingModule({ imports: [DataStateDemoComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DataStateDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(5);
    expect(element.querySelector('[data-state="loading"]')).not.toBeNull();
    expect(element.querySelector('.custom-empty')).not.toBeNull();
    expect(element.querySelector('[data-state="forbidden"].sd-data-state--full-page')).not.toBeNull();
    expect(element.querySelector('[data-success]')?.textContent).toContain('Dữ liệu đã sẵn sàng');

    (element.querySelector('[data-state-retry]') as HTMLButtonElement).click();
    (element.querySelector('[data-state-action]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Retry: 1 · Action: 1');
  });
});
