import { Component, DebugElement, ViewChild, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatTabGroup } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdTab } from './tab.component';
import { SdTabClosedEvent, SdTabGroup } from './tab-group.component';

// ---------------------------------------------------------------------------
// Host helpers
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdTabGroup, SdTab],
  template: `
    <sd-tab-group
      [(selectedIndex)]="selectedIndex"
      [variant]="variant"
      [color]="color"
      [headerPosition]="headerPosition"
      [alignTabs]="alignTabs"
      [animationDuration]="animationDuration"
      [disableRipple]="disableRipple"
      [dynamicHeight]="dynamicHeight"
      [autoId]="autoId"
      (tabClosed)="onTabClosed($event)">
      @for (t of tabs(); track t.id) {
        <sd-tab
          [label]="t.label"
          [icon]="t.icon"
          [badge]="t.badge"
          [disabled]="t.disabled"
          [closable]="t.closable"
          [beforeClose]="t.beforeClose"
          (closeError)="onCloseError($event)">
          <div class="tab-content" [attr.data-tab]="t.id">Content {{ t.id }}</div>
        </sd-tab>
      }
    </sd-tab-group>
  `,
})
class HostComponent {
  @ViewChild(SdTabGroup) group!: SdTabGroup;

  tabs = signal<
    {
      id: string;
      label: string;
      icon?: string;
      badge?: string | number | null;
      disabled?: boolean;
      closable?: boolean;
      beforeClose?: () => boolean | Promise<boolean>;
    }[]
  >([
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ]);

  selectedIndex = 0;
  variant: 'line' | 'pills' | 'segmented' = 'line';
  color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' = 'primary';
  headerPosition: 'above' | 'below' = 'above';
  alignTabs: 'start' | 'center' | 'end' = 'start';
  animationDuration = '500ms';
  disableRipple = false;
  dynamicHeight = false;
  autoId: string | undefined = undefined;

  closedEvents: SdTabClosedEvent[] = [];
  closeErrors: unknown[] = [];
  onTabClosed(ev: SdTabClosedEvent) {
    this.closedEvents.push(ev);
  }
  onCloseError(error: unknown) {
    this.closeErrors.push(error);
  }
}

function getGroup(fixture: ComponentFixture<HostComponent>): SdTabGroup {
  return fixture.componentInstance.group;
}

function getHostEl(fixture: ComponentFixture<HostComponent>): HTMLElement {
  return fixture.debugElement.query(By.directive(SdTabGroup)).nativeElement as HTMLElement;
}

function getMatTabGroup(fixture: ComponentFixture<HostComponent>): MatTabGroup {
  const de: DebugElement = fixture.debugElement.query(By.directive(MatTabGroup));
  if (!de) throw new Error('MatTabGroup not found');
  return de.componentInstance as MatTabGroup;
}

function getTabLabels(fixture: ComponentFixture<HostComponent>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.mat-mdc-tab')) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Suite: SdTabGroup
// ---------------------------------------------------------------------------

describe('SdTabGroup', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let group: SdTabGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    group = getGroup(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation + content children discovery
  // -------------------------------------------------------------------------

  describe('creation & content discovery', () => {
    it('creates SdTabGroup', () => {
      expect(group).toBeTruthy();
    });

    it('discovers projected sd-tab via contentChildren signal', () => {
      expect(group.tabs().length).toBe(3);
    });

    it('updates tabs signal when tab list changes', () => {
      host.tabs.update(arr => arr.slice(0, 2));
      fixture.detectChanges();
      expect(group.tabs().length).toBe(2);
    });

    it('renders one mat-mdc-tab label per sd-tab', () => {
      expect(getTabLabels(fixture).length).toBe(3);
    });

    it('renders the tab label text', () => {
      const labels = getTabLabels(fixture).map(el => el.textContent?.trim());
      expect(labels[0]).toContain('Alpha');
      expect(labels[1]).toContain('Beta');
      expect(labels[2]).toContain('Gamma');
    });
  });

  // -------------------------------------------------------------------------
  // selectedIndex two-way + selectTab clamping
  // -------------------------------------------------------------------------

  describe('selectedIndex (two-way) + selectTab clamping', () => {
    it('defaults selectedIndex to 0', () => {
      expect(group.selectedIndex()).toBe(0);
    });

    it('forwards selectedIndex to MatTabGroup', () => {
      host.selectedIndex = 1;
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).selectedIndex).toBe(1);
    });

    it('selectTab(N) sets selectedIndex to N when in range', () => {
      group.selectTab(2);
      fixture.detectChanges();
      expect(group.selectedIndex()).toBe(2);
    });

    it('selectTab clamps negative input to 0', () => {
      group.selectTab(-5);
      fixture.detectChanges();
      expect(group.selectedIndex()).toBe(0);
    });

    it('selectTab clamps out-of-range index to last tab', () => {
      group.selectTab(99);
      fixture.detectChanges();
      expect(group.selectedIndex()).toBe(2);
    });

    it('propagates selectedIndex change to parent via two-way binding', () => {
      group.selectedIndex.set(1);
      fixture.detectChanges();
      expect(host.selectedIndex).toBe(1);
    });

    it('clamps selectedIndex when last active tab is removed', fakeAsync(() => {
      group.selectTab(2);
      fixture.detectChanges();
      flush();
      expect(group.selectedIndex()).toBe(2);

      host.tabs.update(arr => arr.slice(0, 2));
      fixture.detectChanges();
      flush();

      expect(group.selectedIndex()).toBe(1);
    }));
  });

  // -------------------------------------------------------------------------
  // Forwarding layout inputs to MatTabGroup
  // -------------------------------------------------------------------------

  describe('layout input forwarding', () => {
    it('forwards headerPosition', () => {
      host.headerPosition = 'below';
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).headerPosition).toBe('below');
    });

    it('forwards alignTabs', () => {
      host.alignTabs = 'center';
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).alignTabs).toBe('center');
    });

    it('forwards animationDuration', () => {
      host.animationDuration = '0ms';
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).animationDuration).toBe('0ms');
    });

    it('forwards disableRipple', () => {
      host.disableRipple = true;
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).disableRipple).toBeTrue();
    });

    it('forwards dynamicHeight', () => {
      host.dynamicHeight = true;
      fixture.detectChanges();
      expect(getMatTabGroup(fixture).dynamicHeight).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Icon + badge rendering
  // -------------------------------------------------------------------------

  describe('label rendering: icon + badge', () => {
    it('renders mat-icon when icon is set', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, icon: 'info' } : t)));
      fixture.detectChanges();
      const firstLabel = getTabLabels(fixture)[0];
      const icon = firstLabel.querySelector('mat-icon');
      expect(icon).not.toBeNull();
      expect(icon!.textContent?.trim()).toBe('info');
    });

    it('does NOT render mat-icon when icon is undefined', () => {
      const firstLabel = getTabLabels(fixture)[0];
      // there may be a close icon but no leading icon — query first child
      const leadIcon = firstLabel.querySelector('mat-icon');
      expect(leadIcon).toBeNull();
    });

    it('renders badge span with text when badge=5', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, badge: 5 } : t)));
      fixture.detectChanges();
      const firstLabel = getTabLabels(fixture)[0];
      const badge = firstLabel.querySelector('.sd-tab__badge');
      expect(badge).not.toBeNull();
      expect(badge!.textContent?.trim()).toBe('5');
    });

    it('renders badge span when badge=0 (zero is meaningful)', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, badge: 0 } : t)));
      fixture.detectChanges();
      const firstLabel = getTabLabels(fixture)[0];
      const badge = firstLabel.querySelector('.sd-tab__badge');
      expect(badge).not.toBeNull();
      expect(badge!.textContent?.trim()).toBe('0');
    });

    it('does NOT render badge span when badge is null', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, badge: null } : t)));
      fixture.detectChanges();
      const firstLabel = getTabLabels(fixture)[0];
      expect(firstLabel.querySelector('.sd-tab__badge')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Variant
  // -------------------------------------------------------------------------

  describe('variant', () => {
    it('defaults variant to line (no skin class on host)', () => {
      const el = getHostEl(fixture);
      expect(el.classList.contains('sd-tab-group--pills')).toBeFalse();
      expect(el.classList.contains('sd-tab-group--segmented')).toBeFalse();
    });

    it('adds sd-tab-group--pills class when variant is pills', () => {
      host.variant = 'pills';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.classList.contains('sd-tab-group--pills')).toBeTrue();
      expect(el.classList.contains('sd-tab-group--segmented')).toBeFalse();
    });

    it('adds sd-tab-group--segmented class when variant is segmented', () => {
      host.variant = 'segmented';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.classList.contains('sd-tab-group--segmented')).toBeTrue();
      expect(el.classList.contains('sd-tab-group--pills')).toBeFalse();
    });

    it('switches skin class when variant changes at runtime', () => {
      const el = getHostEl(fixture);
      host.variant = 'pills';
      fixture.detectChanges();
      expect(el.classList.contains('sd-tab-group--pills')).toBeTrue();

      host.variant = 'segmented';
      fixture.detectChanges();
      expect(el.classList.contains('sd-tab-group--pills')).toBeFalse();
      expect(el.classList.contains('sd-tab-group--segmented')).toBeTrue();

      host.variant = 'line';
      fixture.detectChanges();
      expect(el.classList.contains('sd-tab-group--pills')).toBeFalse();
      expect(el.classList.contains('sd-tab-group--segmented')).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // Color
  // -------------------------------------------------------------------------

  describe('color', () => {
    it('defaults color CSS vars to primary', () => {
      const el = getHostEl(fixture);
      expect(el.style.getPropertyValue('--sd-tab-indicator-color')).toBe('var(--sd-primary)');
      expect(el.style.getPropertyValue('--sd-tab-label-active-color')).toBe('var(--sd-primary)');
      expect(el.style.getPropertyValue('--sd-tab-badge-bg')).toBe('var(--sd-primary-light)');
      expect(el.style.getPropertyValue('--sd-tab-badge-color')).toBe('var(--sd-primary)');
    });

    it('switches CSS vars when color changes to success', () => {
      host.color = 'success';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.style.getPropertyValue('--sd-tab-indicator-color')).toBe('var(--sd-success)');
      expect(el.style.getPropertyValue('--sd-tab-label-active-color')).toBe('var(--sd-success)');
      expect(el.style.getPropertyValue('--sd-tab-badge-bg')).toBe('var(--sd-success-light)');
      expect(el.style.getPropertyValue('--sd-tab-badge-color')).toBe('var(--sd-success)');
    });

    it('supports each Core palette value', () => {
      const colors: ('primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error')[] = [
        'primary',
        'secondary',
        'info',
        'success',
        'warning',
        'error',
      ];
      const el = getHostEl(fixture);
      for (const c of colors) {
        host.color = c;
        fixture.detectChanges();
        expect(el.style.getPropertyValue('--sd-tab-indicator-color')).toBe(`var(--sd-${c})`);
        expect(el.style.getPropertyValue('--sd-tab-badge-bg')).toBe(`var(--sd-${c}-light)`);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Disabled tab
  // -------------------------------------------------------------------------

  describe('disabled tab', () => {
    it('mat-tab gets disabled class when sd-tab is disabled', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)));
      fixture.detectChanges();
      const labels = getTabLabels(fixture);
      expect(labels[1].classList.contains('mat-mdc-tab-disabled')).toBeTrue();
    });

    it('sets aria-disabled on the disabled tab', () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 1 ? { ...t, disabled: true } : t)));
      fixture.detectChanges();
      const labels = getTabLabels(fixture);
      expect(labels[1].getAttribute('aria-disabled')).toBe('true');
    });
  });

  // -------------------------------------------------------------------------
  // Closable tab
  // -------------------------------------------------------------------------

  describe('closable tab', () => {
    beforeEach(() => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, closable: true } : t)));
      fixture.detectChanges();
    });

    it('renders close icon on closable tab', () => {
      const firstLabel = getTabLabels(fixture)[0];
      const close = firstLabel.querySelector('.sd-tab__close');
      expect(close).not.toBeNull();
    });

    it('does not render close icon on non-closable tab', () => {
      const secondLabel = getTabLabels(fixture)[1];
      expect(secondLabel.querySelector('.sd-tab__close')).toBeNull();
    });

    // why: nút đóng từng là `<sd-icon role="button" aria-label="Close tab">` — custom element
    // không tự focusable và không có handler bàn phím, tức người dùng bàn phím không đóng được tab.
    it('renders the close affordance as a real focusable button with an i18n label', () => {
      const close = getTabLabels(fixture)[0].querySelector('.sd-tab__close') as HTMLElement;

      expect(close.tagName).toBe('BUTTON');
      expect(close.getAttribute('type')).toBe('button');
      expect(close.getAttribute('aria-label')).toBeTruthy();
      expect(close.getAttribute('aria-label')).not.toBe('Close tab');
    });

    it('keyboard activation of the close button emits tabClosed, same as a mouse click', () => {
      const close = getTabLabels(fixture)[0].querySelector('.sd-tab__close') as HTMLButtonElement;

      // Native <button>: Enter/Space đều được trình duyệt dịch thành một click event thật.
      close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      close.click();
      fixture.detectChanges();

      expect(host.closedEvents.length).toBe(1);
      expect(host.closedEvents[0].index).toBe(0);
    });

    it('clicking close emits tabClosed with correct index + tab', () => {
      const firstLabel = getTabLabels(fixture)[0];
      const close = firstLabel.querySelector('.sd-tab__close') as HTMLElement;
      close.click();
      fixture.detectChanges();
      expect(host.closedEvents.length).toBe(1);
      expect(host.closedEvents[0].index).toBe(0);
      expect(host.closedEvents[0].tab).toBeTruthy();
    });

    it('clicking close does NOT change selectedIndex (stopPropagation)', () => {
      host.selectedIndex = 2;
      fixture.detectChanges();
      const firstLabel = getTabLabels(fixture)[0];
      const close = firstLabel.querySelector('.sd-tab__close') as HTMLElement;
      close.click();
      fixture.detectChanges();
      expect(host.selectedIndex).toBe(2);
    });

    it('does not emit close events when beforeClose returns false', async () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, beforeClose: () => false } : t)));
      fixture.detectChanges();

      (getTabLabels(fixture)[0].querySelector('.sd-tab__close') as HTMLElement).click();
      await fixture.whenStable();

      expect(host.closedEvents).toEqual([]);
    });

    it('emits close events when async beforeClose resolves true', async () => {
      host.tabs.update(arr => arr.map((t, i) => (i === 0 ? { ...t, beforeClose: () => Promise.resolve(true) } : t)));
      fixture.detectChanges();

      (getTabLabels(fixture)[0].querySelector('.sd-tab__close') as HTMLElement).click();
      await fixture.whenStable();

      expect(host.closedEvents.length).toBe(1);
    });

    it('fails closed and emits closeError when beforeClose throws', async () => {
      const error = new Error('confirmation failed');
      host.tabs.update(arr =>
        arr.map((t, i) =>
          i === 0
            ? {
                ...t,
                beforeClose: () => {
                  throw error;
                },
              }
            : t
        )
      );
      fixture.detectChanges();

      (getTabLabels(fixture)[0].querySelector('.sd-tab__close') as HTMLElement).click();
      await fixture.whenStable();

      expect(host.closedEvents).toEqual([]);
      expect(host.closeErrors).toEqual([error]);
    });
  });

  // -------------------------------------------------------------------------
  // Lazy content rendering
  // -------------------------------------------------------------------------

  describe('lazy content', () => {
    it('renders only the active tab content initially', () => {
      // tab 0 active → its content present, tab 1/2 not in DOM yet
      const contents = fixture.nativeElement.querySelectorAll('.tab-content');
      expect(contents.length).toBe(1);
      expect((contents[0] as HTMLElement).dataset['tab']).toBe('a');
    });

    it('renders tab content after activation', fakeAsync(() => {
      group.selectTab(1);
      fixture.detectChanges();
      tick(0);
      flush();
      fixture.detectChanges();

      const contents = Array.from(fixture.nativeElement.querySelectorAll('.tab-content')) as HTMLElement[];
      const ids = contents.map(el => el.dataset['tab']);
      expect(ids).toContain('b');
    }));
  });

  // -------------------------------------------------------------------------
  // autoId
  // -------------------------------------------------------------------------

  describe('autoId', () => {
    it('does not set data-autoId attribute when autoId is undefined', () => {
      const el = getHostEl(fixture);
      expect(el.getAttribute('data-autoId')).toBeNull();
    });

    it('sets data-autoId attribute when autoId is provided', () => {
      host.autoId = 'userTabs';
      fixture.detectChanges();
      const el = getHostEl(fixture);
      expect(el.getAttribute('data-autoId')).toBe('userTabs');
    });
  });

  // -------------------------------------------------------------------------
  // Public API: realignInkBar
  // -------------------------------------------------------------------------

  describe('realignInkBar', () => {
    it('calls MatTabGroup.realignInkBar without throwing', () => {
      const matGroup = getMatTabGroup(fixture);
      const spy = spyOn(matGroup, 'realignInkBar');
      group.realignInkBar();
      expect(spy).toHaveBeenCalled();
    });
  });
});
