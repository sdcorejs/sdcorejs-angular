import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTabGroup } from './tab-group.component';
import { SdTab } from './tab.component';

@Component({
  standalone: true,
  imports: [SdTabGroup, SdTab],
  template: `
    <sd-tab-group
      class="outer"
      [variant]="variant()"
      [headerPosition]="position()"
      [headerClass]="headerClass()"
      [headerStyle]="headerStyle()"
      [bodyClass]="bodyClass()"
      [bodyStyle]="bodyStyle()"
      animationDuration="0ms">
      <sd-tab label="First">
        <sd-tab-group class="nested"><sd-tab label="Nested">Nested body</sd-tab></sd-tab-group>
      </sd-tab>
      <sd-tab label="Second">Second body</sd-tab>
    </sd-tab-group>
    <sd-tab-group class="sibling"><sd-tab label="Other">Other body</sd-tab></sd-tab-group>
  `,
})
class RegionsHost {
  headerClass = signal('');
  bodyClass = signal('');
  headerStyle = signal<Record<string, string | number | null> | null>(null);
  bodyStyle = signal<Record<string, string | number | null> | null>(null);
  variant = signal<'line' | 'pills' | 'segmented'>('line');
  position = signal<'above' | 'below'>('above');
}

describe('SdTabGroup region customization', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [RegionsHost, NoopAnimationsModule] }));

  async function mount() {
    const fixture = TestBed.createComponent(RegionsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const header = root.querySelector<HTMLElement>('.outer > mat-tab-group > mat-tab-header')!;
    const body = root.querySelector<HTMLElement>('.outer > mat-tab-group > .mat-mdc-tab-body-wrapper')!;
    return { fixture, host: fixture.componentInstance, root, header, body };
  }

  it('preserves default Material classes and styles when inputs are omitted', async () => {
    const { fixture, header, body } = await mount();
    expect(header.classList.contains('mat-mdc-tab-header')).toBeTrue();
    expect(body.classList.contains('mat-mdc-tab-body-wrapper')).toBeTrue();
    expect(header.style.backgroundColor).toBe('');
    expect(body.style.backgroundColor).toBe('');
    fixture.destroy();
  });

  it('styles only the own header and body, leaving nested and sibling groups alone', async () => {
    const { fixture, host, root, header, body } = await mount();
    host.headerClass.set('white-header compact');
    host.bodyClass.set('content-region');
    host.headerStyle.set({ backgroundColor: '#fff', '--region-accent': 'blue' });
    host.bodyStyle.set({ 'background-color': '#eef2ff', padding: '16px', opacity: 0.9 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(header.classList.contains('white-header')).toBeTrue();
    expect(header.classList.contains('compact')).toBeTrue();
    expect(header.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(header.style.getPropertyValue('--region-accent')).toBe('blue');
    expect(body.classList.contains('content-region')).toBeTrue();
    expect(body.style.backgroundColor).toBe('rgb(238, 242, 255)');
    expect(body.style.padding).toBe('16px');
    expect(body.style.opacity).toBe('0.9');
    expect(body.classList.contains('white-header')).toBeFalse();
    for (const selector of ['.nested', '.sibling']) {
      const other = root.querySelector<HTMLElement>(`${selector} > mat-tab-group > mat-tab-header`)!;
      expect(other.classList.contains('white-header')).toBeFalse();
      expect(other.style.backgroundColor).toBe('');
    }
    fixture.destroy();
  });

  it('replaces and clears owned styles and classes without removing Material classes', async () => {
    const { fixture, host, header, body } = await mount();
    body.style.setProperty('padding', '4px', 'important');
    host.headerClass.set('first mat-mdc-tab-header');
    host.bodyClass.set('first-body');
    host.headerStyle.set({ backgroundColor: '#fff', padding: '8px' });
    host.bodyStyle.set({ padding: '12px' });
    fixture.detectChanges();
    await fixture.whenStable();
    host.headerClass.set('second');
    host.bodyClass.set('');
    host.headerStyle.set({ backgroundColor: null, color: 'red' });
    host.bodyStyle.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(header.classList.contains('first')).toBeFalse();
    expect(header.classList.contains('second')).toBeTrue();
    expect(header.classList.contains('mat-mdc-tab-header')).toBeTrue();
    expect(header.style.padding).toBe('');
    expect(header.style.backgroundColor).toBe('');
    expect(header.style.color).toBe('red');
    expect(body.classList.contains('first-body')).toBeFalse();
    expect(body.classList.contains('mat-mdc-tab-body-wrapper')).toBeTrue();
    expect(body.style.padding).toBe('4px');
    expect(body.style.getPropertyPriority('padding')).toBe('important');
    fixture.destroy();
  });

  for (const variant of ['line', 'pills', 'segmented'] as const) {
    it(`supports ${variant} tabs and moving the header below the body`, async () => {
      const { fixture, host, header, body } = await mount();
      host.variant.set(variant);
      host.position.set('below');
      host.headerStyle.set({ backgroundColor: '#fff' });
      host.bodyClass.set('content-region');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getComputedStyle(header).backgroundColor).toBe('rgb(255, 255, 255)');
      expect(body.classList.contains('content-region')).toBeTrue();
      fixture.destroy();
    });
  }
});
