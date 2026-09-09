import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DataStateDemoComponent } from './data-state-demo.component';

describe('DataStateDemoComponent', () => {
  it('renders all five states and wires custom, retry, action and transparent success examples', async () => {
    await TestBed.configureTestingModule({ imports: [DataStateDemoComponent, NoopAnimationsModule] }).compileComponents();
    const fixture = TestBed.createComponent(DataStateDemoComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('demo-section')).toHaveSize(7);
    const retainedSelection = element.querySelector('sd-select[label="Giữ hai lựa chọn"]');
    expect(retainedSelection?.hasAttribute('multiple')).toBeTrue();
    expect(retainedSelection?.getAttribute('minWidthPanel')).toBe('180px');
    expect(element.querySelector('sd-autocomplete[label="Tìm kiếm 180px"]')).not.toBeNull();
    expect(element.querySelector('[data-state="loading"]')).not.toBeNull();
    expect(element.querySelector('.custom-empty')).not.toBeNull();
    expect(element.querySelector('[data-state="forbidden"].sd-data-state--full-page')).not.toBeNull();
    expect(element.querySelector('[data-success]')?.textContent).toContain('Dữ liệu đã sẵn sàng');

    (element.querySelector('sd-button[data-state-retry] button') as HTMLButtonElement).click();
    (element.querySelector('sd-button[data-state-action] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Retry: 1 · Action: 1');
  });
});
