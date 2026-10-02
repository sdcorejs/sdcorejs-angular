import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Color } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { resolveSdIconConfig, SD_ICON_CONFIGURATION, type SdIconShape } from '@sdcorejs/angular/modules/icon';
import { SdInform } from './inform.component';
import { SdInformActionDirective } from './inform-action.directive';
import { queryByCss, setInput } from '../../../testing/test-utils';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdInform, SdInformActionDirective],
  template: `
    <sd-inform [actionLabel]="label">
      <button sdInformAction class="projected-btn">Custom</button>
    </sd-inform>
  `,
})
class ActionHostComponent {
  label: string | undefined = 'Action';
}

describe('SdInform', () => {
  let fixture: ComponentFixture<SdInform>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdInform, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdInform);
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the .c-inform container with a live role', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div.c-inform')).not.toBeNull();
  });

  describe('role (a11y)', () => {
    it('uses role="status" for non-severe colors (primary default)', () => {
      fixture.detectChanges();
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').getAttribute('role')).toBe('status');
    });
    it('uses role="status" for info', () => {
      setInput(fixture, 'info', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').getAttribute('role')).toBe('status');
    });
    it('uses role="alert" for error', () => {
      setInput(fixture, 'error', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').getAttribute('role')).toBe('alert');
    });
    it('uses role="alert" for warning', () => {
      setInput(fixture, 'warning', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').getAttribute('role')).toBe('alert');
    });
  });

  describe('color system', () => {
    it('defaults effectiveColor to "primary"', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.effectiveColor()).toBe('primary');
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-primary')).toBe(true);
    });
    it('coerces falsy color back to "primary"', () => {
      setInput(fixture, 'color', null);
      expect(fixture.componentInstance.color()).toBe('primary');
    });
    it('applies the class for the explicit color input', () => {
      setInput(fixture, 'color', 'success');
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-success')).toBe(true);
    });
    it('primary boolean wins over all others', () => {
      setInput(fixture, 'primary', true);
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'warning');
      expect(fixture.componentInstance.effectiveColor()).toBe('primary');
    });
    it('secondary wins over info/success/warning/error/color', () => {
      setInput(fixture, 'secondary', true);
      setInput(fixture, 'success', true);
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('secondary');
    });
    it('info wins over success/warning/error/color', () => {
      setInput(fixture, 'info', true);
      setInput(fixture, 'warning', true);
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('info');
    });
    it('success wins over warning/error/color', () => {
      setInput(fixture, 'success', true);
      setInput(fixture, 'warning', true);
      expect(fixture.componentInstance.effectiveColor()).toBe('success');
    });
    it('warning wins over error/color', () => {
      setInput(fixture, 'warning', true);
      setInput(fixture, 'error', true);
      expect(fixture.componentInstance.effectiveColor()).toBe('warning');
    });
    it('error wins over color (last in chain)', () => {
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'primary');
      expect(fixture.componentInstance.effectiveColor()).toBe('error');
    });
    it('applies c-secondary class', () => {
      setInput(fixture, 'secondary', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-secondary')).toBe(true);
    });
    it('applies c-info class', () => {
      setInput(fixture, 'info', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-info')).toBe(true);
    });
    it('applies c-warning class', () => {
      setInput(fixture, 'warning', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-warning')).toBe(true);
    });
    it('applies c-error class', () => {
      setInput(fixture, 'error', true);
      expect(queryByCss<HTMLElement>(fixture, 'div.c-inform').classList.contains('c-error')).toBe(true);
    });
  });

  describe('icon', () => {
    it('shows auto icon "info" for primary (default)', () => {
      fixture.detectChanges();
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon mat-icon').textContent?.trim()).toBe('info');
    });
    it('auto icon "check_circle" for success', () => {
      setInput(fixture, 'success', true);
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon mat-icon').textContent?.trim()).toBe('check_circle');
    });
    it('auto outline icon for warning', () => {
      setInput(fixture, 'warning', true);
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon mat-icon').textContent?.trim()).toBe('warning_amber');
    });
    it('auto outline icon for error', () => {
      setInput(fixture, 'error', true);
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon mat-icon').textContent?.trim()).toBe('report_gmailerrorred');
    });
    it('explicit icon overrides the auto map', () => {
      setInput(fixture, 'icon', 'campaign');
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon mat-icon').textContent?.trim()).toBe('campaign');
    });
    it('hideIcon removes the icon even when icon is provided', () => {
      setInput(fixture, 'icon', 'campaign');
      setInput(fixture, 'hideIcon', true);
      expect(fixture.nativeElement.querySelector('sd-icon.c-inform-icon')).toBeNull();
      expect(fixture.componentInstance.effectiveIcon()).toBeNull();
    });
    it('applies fontSet class on the icon', () => {
      setInput(fixture, 'fontSet', 'material-icons-outlined');
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon').classList.contains('sd-icon--material-icons-outlined')).toBe(true);
    });
    it('normalizes a null fontSet so SdIcon can inherit the provider default', () => {
      setInput(fixture, 'fontSet', null);
      expect(fixture.componentInstance.fontSet()).toBeUndefined();
      expect(queryByCss(fixture, 'sd-icon.c-inform-icon').classList.contains('sd-icon--material')).toBe(true);
    });
  });

  describe('title & description', () => {
    it('renders title when provided', () => {
      setInput(fixture, 'title', 'Message Title');
      expect(queryByCss(fixture, '.c-inform-title').textContent?.trim()).toBe('Message Title');
    });
    it('does NOT render title element when undefined', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inform-title')).toBeNull();
    });
    it('renders description when provided', () => {
      setInput(fixture, 'description', 'Message body.');
      expect(queryByCss(fixture, '.c-inform-body').textContent?.trim()).toBe('Message body.');
    });
    it('does NOT render body element when description undefined', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inform-body')).toBeNull();
    });
  });

  describe('closable', () => {
    it('does NOT render close button by default', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inform-close')).toBeNull();
    });
    it('renders close button when closable=true', () => {
      setInput(fixture, 'closable', true);
      expect(fixture.nativeElement.querySelector('.c-inform-close')).not.toBeNull();
    });
    it('emits sdClosed and hides host on close click', () => {
      let emitted: Event | null = null;
      fixture.componentInstance.sdClosed.subscribe(e => (emitted = e));
      setInput(fixture, 'closable', true);
      const btn = queryByCss<HTMLButtonElement>(fixture, '.c-inform-close');
      const ev = new MouseEvent('click', { bubbles: true });
      const stopSpy = spyOn(ev, 'stopPropagation').and.callThrough();
      btn.dispatchEvent(ev);
      fixture.detectChanges();
      expect(stopSpy).toHaveBeenCalled();
      expect(emitted as Event | null).toBe(ev);
      expect(fixture.componentInstance.dismissed()).toBe(true);
      expect(fixture.nativeElement.querySelector('div.c-inform')).toBeNull();
    });
  });

  describe('action', () => {
    it('renders actionLabel link when provided (no projection)', () => {
      setInput(fixture, 'actionLabel', 'Action');
      const link = queryByCss<HTMLButtonElement>(fixture, '.c-inform-action-link');
      expect(link.textContent?.trim()).toBe('Action');
    });
    it('does NOT render action when neither label nor slot present', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.c-inform-action')).toBeNull();
    });
    it('emits sdAction on link click with stopPropagation', () => {
      let emitted: Event | null = null;
      fixture.componentInstance.sdAction.subscribe(e => (emitted = e));
      setInput(fixture, 'actionLabel', 'Action');
      const link = queryByCss<HTMLButtonElement>(fixture, '.c-inform-action-link');
      const ev = new MouseEvent('click', { bubbles: true });
      const stopSpy = spyOn(ev, 'stopPropagation').and.callThrough();
      link.dispatchEvent(ev);
      expect(stopSpy).toHaveBeenCalled();
      expect(emitted as Event | null).toBe(ev);
    });
    it('projected [sdInformAction] overrides the actionLabel link', () => {
      const host = TestBed.createComponent(ActionHostComponent);
      host.detectChanges();
      expect(host.nativeElement.querySelector('.projected-btn')).not.toBeNull();
      expect(host.nativeElement.querySelector('.c-inform-action-link')).toBeNull();
    });
  });

  describe('line clamp + toggle', () => {
    function stubBody(fix: ComponentFixture<SdInform>, scrollHeight: number, clientHeight: number) {
      (fix.componentInstance as any).bodyRef = () => ({
        nativeElement: { scrollHeight, clientHeight } as unknown as HTMLElement,
      });
    }
    function t(key: string): string {
      return TestBed.inject(I18nService).t(key);
    }
    it('no toggle when lineClamp is unset', () => {
      setInput(fixture, 'description', 'Long body text here.');
      expect(fixture.nativeElement.querySelector('.c-inform-toggle')).toBeNull();
      expect(fixture.componentInstance.showToggle()).toBe(false);
    });
    it('applies -webkit-line-clamp and is-clamped when lineClamp set', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      const body = queryByCss<HTMLElement>(fixture, '.c-inform-body');
      expect(body.classList.contains('is-clamped')).toBe(true);
      expect(body.style.webkitLineClamp || body.style.getPropertyValue('-webkit-line-clamp')).toBe('3');
    });
    it('shows toggle when content overflows the clamp', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      stubBody(fixture, 120, 60);
      fixture.componentInstance.measureOverflow();
      fixture.detectChanges();
      expect(fixture.componentInstance.overflowing()).toBe(true);
      expect(queryByCss(fixture, '.c-inform-toggle').textContent?.trim()).toBe(t('core.component.inform.show-more'));
    });
    it('does NOT mark overflow within the +1 sub-pixel guard (61 vs 60)', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      stubBody(fixture, 61, 60); // diff = 1, not > clientHeight + 1
      fixture.componentInstance.measureOverflow();
      expect(fixture.componentInstance.overflowing()).toBe(false);
    });

    it('marks overflow just beyond the +1 guard (62 vs 60)', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      stubBody(fixture, 62, 60); // diff = 2, > clientHeight + 1
      fixture.componentInstance.measureOverflow();
      expect(fixture.componentInstance.overflowing()).toBe(true);
    });
    it('does NOT show toggle when content fits', () => {
      setInput(fixture, 'description', 'Short.');
      setInput(fixture, 'lineClamp', 3);
      stubBody(fixture, 60, 60);
      fixture.componentInstance.measureOverflow();
      fixture.detectChanges();
      expect(fixture.componentInstance.overflowing()).toBe(false);
      expect(fixture.nativeElement.querySelector('.c-inform-toggle')).toBeNull();
    });
    it('toggleExpanded flips expanded, removes clamp, switches label to show-less', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      stubBody(fixture, 120, 60);
      fixture.componentInstance.measureOverflow();
      fixture.detectChanges();
      fixture.componentInstance.toggleExpanded();
      fixture.detectChanges();
      expect(fixture.componentInstance.expanded()).toBe(true);
      expect(fixture.componentInstance.clampLines()).toBeNull();
      expect(queryByCss(fixture, '.c-inform-toggle').textContent?.trim()).toBe(t('core.component.inform.show-less'));
    });
    it('measureOverflow is a no-op when expanded', () => {
      setInput(fixture, 'description', 'Long body text here.');
      setInput(fixture, 'lineClamp', 3);
      fixture.componentInstance.expanded.set(true);
      stubBody(fixture, 999, 10);
      fixture.componentInstance.measureOverflow();
      expect(fixture.componentInstance.overflowing()).toBe(false);
    });
  });

  describe('autoId', () => {
    it('emits data-autoId / data-autoid when set', () => {
      setInput(fixture, 'autoId', 'inform-1');
      const el = queryByCss<HTMLElement>(fixture, 'div.c-inform');
      expect(el.getAttribute('data-autoId')).toBe('inform-1');
      expect(el.getAttribute('data-autoid')).toBe('inform-1');
    });
    it('omits the attribute when autoId unset', () => {
      fixture.detectChanges();
      const el = queryByCss<HTMLElement>(fixture, 'div.c-inform');
      expect(el.hasAttribute('data-autoId')).toBe(false);
    });
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdInform],
  template: `<sd-inform [type]="type" [color]="color" [iconShape]="iconShape" title="Shape"></sd-inform>`,
})
class ShapeHostComponent {
  type: 'default' | 'tip' = 'default';
  color: Color = 'primary';
  iconShape: SdIconShape | null | undefined = undefined;
}

const INFORM_TONES: Color[] = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

function createShapeHost(defaultShape?: SdIconShape): ComponentFixture<ShapeHostComponent> {
  TestBed.configureTestingModule({
    imports: [ShapeHostComponent, NoopAnimationsModule],
    providers: defaultShape ? [{ provide: SD_ICON_CONFIGURATION, useValue: resolveSdIconConfig({ defaultShape }) }] : [],
  });
  const fixture = TestBed.createComponent(ShapeHostComponent);
  // why: the isolated test runner does not load the app-level theme, so give every tone a visible background.
  INFORM_TONES.forEach((tone, index) => fixture.nativeElement.style.setProperty(`--sd-${tone}-light`, `rgb(${10 + index}, 20, 30)`));
  fixture.detectChanges();
  return fixture;
}

function iconTile(fixture: ComponentFixture<unknown>): HTMLElement {
  return (fixture.nativeElement as HTMLElement).querySelector('.c-inform-icon-tile') as HTMLElement;
}

describe('SdInform icon shape', () => {
  it('defaults to square without a provider', () => {
    expect(iconTile(createShapeHost()).getAttribute('data-icon-shape')).toBe('square');
  });

  it('follows the app default and lets the instance input win', () => {
    const fixture = createShapeHost('circle');
    expect(iconTile(fixture).getAttribute('data-icon-shape')).toBe('circle');
    fixture.componentInstance.iconShape = 'none';
    fixture.detectChanges();
    expect(iconTile(fixture).getAttribute('data-icon-shape')).toBe('none');
  });

  it('renders square with an 8px radius that the token can change', () => {
    const fixture = createShapeHost();
    const tile = iconTile(fixture);
    expect(getComputedStyle(tile).borderTopLeftRadius).toBe('8px');
    expect(getComputedStyle(tile).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    fixture.nativeElement.style.setProperty('--sd-icon-shape-radius', '4px');
    expect(getComputedStyle(tile).borderTopLeftRadius).toBe('4px');
  });

  it('renders circle like before and none without a background at the same size, for every tone', () => {
    const fixture = createShapeHost();
    for (const tone of INFORM_TONES) {
      fixture.componentInstance.color = tone;
      fixture.componentInstance.iconShape = 'square';
      fixture.detectChanges();
      const tile = iconTile(fixture);
      const squareBackground = getComputedStyle(tile).backgroundColor;
      const squareSize = [getComputedStyle(tile).width, getComputedStyle(tile).height];

      fixture.componentInstance.iconShape = 'circle';
      fixture.detectChanges();
      expect(getComputedStyle(tile).borderTopLeftRadius).withContext(tone).toBe('50%');
      expect(getComputedStyle(tile).backgroundColor).withContext(tone).toBe(squareBackground);

      fixture.componentInstance.iconShape = 'none';
      fixture.detectChanges();
      expect(getComputedStyle(tile).backgroundColor).withContext(tone).toBe('rgba(0, 0, 0, 0)');
      expect([getComputedStyle(tile).width, getComputedStyle(tile).height])
        .withContext(tone)
        .toEqual(squareSize);
    }
  });

  it('keeps the tip icon flat and transparent for every shape', () => {
    const fixture = createShapeHost();
    fixture.componentInstance.type = 'tip';
    for (const shape of ['square', 'circle', 'none'] as SdIconShape[]) {
      fixture.componentInstance.iconShape = shape;
      fixture.detectChanges();
      const tile = iconTile(fixture);
      expect(tile.getAttribute('data-icon-shape')).toBe(shape);
      expect(getComputedStyle(tile).backgroundColor).withContext(shape).toBe('rgba(0, 0, 0, 0)');
      expect(getComputedStyle(tile).borderTopLeftRadius).withContext(shape).toBe('0px');
    }
  });
});
