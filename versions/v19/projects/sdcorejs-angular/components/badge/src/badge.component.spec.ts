import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdBadge } from './badge.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdBadge', () => {
  let fixture: ComponentFixture<SdBadge>;

  const getIconComponent = () => fixture.debugElement.query(By.directive(SdIcon)).componentInstance as SdIcon;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdBadge, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdBadge);
  });

  describe('default render', () => {
    it('defaults type to "icon" with default icon fiber_manual_record', () => {
      fixture.detectChanges();
      const icon = queryByCss(fixture, 'sd-icon.c-material-icon mat-icon');
      expect(icon.textContent?.trim()).toBe('fiber_manual_record');
    });

    it('coerces falsy type back to "icon"', () => {
      setInput(fixture, 'type', null);
      expect(fixture.componentInstance.type()).toBe('icon');
    });

    it('coerces falsy color back to "secondary"', () => {
      setInput(fixture, 'color', null);
      expect(fixture.componentInstance.color()).toBe('secondary');
    });
  });

  describe('type variants', () => {
    it('renders pill div when type="round"', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'title', 'Active');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.textContent?.trim()).toBe('Active');
      expect(fixture.nativeElement.querySelector('sd-icon.c-material-icon')).toBeNull();
    });

    it('renders tag wrapper when type="tag"', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'title', 'Tag');
      setInput(fixture, 'icon', 'label');
      expect(fixture.nativeElement.querySelector('div.c-badge--tag')).not.toBeNull();
      expect(queryByCss(fixture, 'span.c-badge-title').textContent?.trim()).toBe('Tag');
    });

    it('renders icon row when type="icon"', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'title', 'Info');
      expect(fixture.nativeElement.querySelector('div.c-badge-icon')).not.toBeNull();
    });
  });

  describe('boolean color shortcuts (precedence)', () => {
    it('primary wins over secondary/success/info/warning/error/color', () => {
      setInput(fixture, 'primary', true);
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'warning');
      expect(fixture.componentInstance.effectiveColor()).toBe('primary');
    });

    it('secondary wins over success/info/warning/error/color (no primary)', () => {
      setInput(fixture, 'secondary', true);
      setInput(fixture, 'success', true);
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('secondary');
    });

    it('success wins over info/warning/error/color (no primary/secondary)', () => {
      setInput(fixture, 'success', true);
      setInput(fixture, 'warning', true);
      expect(fixture.componentInstance.effectiveColor()).toBe('success');
    });

    it('falls back to color input when no boolean shortcut set', () => {
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('error');
    });

    it('returns "secondary" by default', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance.effectiveColor()).toBe('secondary');
    });
  });

  describe('class bindings', () => {
    it('applies c-primary when effective color is primary', () => {
      setInput(fixture, 'primary', true);
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('c-primary')).toBe(true);
    });

    it('applies c-success when effective color is success', () => {
      setInput(fixture, 'success', true);
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-success')).toBe(true);
    });
  });

  describe('click output', () => {
    it('emits click with stopPropagation', () => {
      let received: any = null;
      const spyStop = jasmine.createSpy('stopPropagation');
      fixture.componentInstance.click.subscribe((e: Event) => (received = e));
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');

      const ev = new MouseEvent('click', { bubbles: true });
      spyOn(ev, 'stopPropagation').and.callFake(spyStop);
      el.dispatchEvent(ev);

      expect(spyStop).toHaveBeenCalled();
      expect(received).toBe(ev);
    });

    it('applies pointer class only when click is observed', () => {
      fixture.componentInstance.click.subscribe(() => undefined);
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('pointer')).toBe(true);
    });

    it('does NOT apply pointer class when no subscriber', () => {
      setInput(fixture, 'type', 'round');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge');
      expect(el.classList.contains('pointer')).toBe(false);
    });
  });

  describe('description', () => {
    it('renders description in tag type when provided', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'icon', 'label');
      setInput(fixture, 'title', 'A');
      setInput(fixture, 'description', 'desc text');
      const desc = queryByCss(fixture, 'span.c-badge-description');
      expect(desc.textContent?.trim()).toBe('desc text');
    });

    it('does NOT render description when not provided (icon type)', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'title', 'A');
      expect(fixture.nativeElement.querySelector('span.c-badge-description')).toBeNull();
    });
  });

  describe('custom icon', () => {
    it('uses provided icon name', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'icon', 'check_circle');
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').textContent?.trim()).toBe('check_circle');
    });
  });

  // ===========================================================================
  // Branch-coverage extensions (batch 4)
  // ===========================================================================
  describe('boolean color shortcuts — remaining precedence branches', () => {
    it('info wins over warning/error/color (no primary/secondary/success)', () => {
      setInput(fixture, 'info', true);
      setInput(fixture, 'warning', true);
      setInput(fixture, 'color', 'error');
      expect(fixture.componentInstance.effectiveColor()).toBe('info');
    });

    it('warning wins over error/color (no other shortcut)', () => {
      setInput(fixture, 'warning', true);
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'primary');
      expect(fixture.componentInstance.effectiveColor()).toBe('warning');
    });

    it('error wins over color (last in chain)', () => {
      setInput(fixture, 'error', true);
      setInput(fixture, 'color', 'primary');
      expect(fixture.componentInstance.effectiveColor()).toBe('error');
    });
  });

  describe('class bindings — remaining color branches', () => {
    it('applies c-info when effective color is info (round type)', () => {
      setInput(fixture, 'info', true);
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-info')).toBe(true);
    });

    it('applies c-warning when effective color is warning (round type)', () => {
      setInput(fixture, 'warning', true);
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-warning')).toBe(true);
    });

    it('applies c-error when effective color is error (round type)', () => {
      setInput(fixture, 'error', true);
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-error')).toBe(true);
    });

    it('iconColorClasses: secondary → c-secondary (icon type, default color)', () => {
      setInput(fixture, 'type', 'icon');
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      expect(icon.classList.contains('c-secondary')).toBe(true);
    });

    it('iconColorClasses: info → c-info (icon type)', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'info', true);
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      expect(icon.classList.contains('c-info')).toBe(true);
    });

    it('iconColorClasses: warning → c-warning (icon type)', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'warning', true);
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      expect(icon.classList.contains('c-warning')).toBe(true);
    });

    it('iconColorClasses: error → c-error (icon type)', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'error', true);
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      expect(icon.classList.contains('c-error')).toBe(true);
    });
  });

  describe('size variants', () => {
    it('size="sm" → c-sm on icon element (default)', () => {
      setInput(fixture, 'type', 'icon');
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').classList.contains('c-sm')).toBe(true);
    });

    it('size="md" → c-md on icon element', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'size', 'md');
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').classList.contains('c-md')).toBe(true);
    });

    it('size="lg" → c-lg on icon element', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'size', 'lg');
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').classList.contains('c-lg')).toBe(true);
    });

    it('coerces falsy size back to "sm"', () => {
      setInput(fixture, 'size', null);
      expect(fixture.componentInstance.size()).toBe('sm');
    });

    it('centers icon glyph within the declared icon box', () => {
      setInput(fixture, 'type', 'icon');
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      const style = getComputedStyle(icon);

      expect(style.display).toContain('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.paddingLeft).toBe('0px');
      expect(style.paddingRight).toBe('0px');
      expect(style.width).toBe('20px');
      expect(style.height).toBe('20px');
    });

    it('centers tag icon within the declared badge icon box', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'icon', 'label');
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      const style = getComputedStyle(icon);

      expect(style.display).toContain('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.width).toBe('16px');
      expect(style.height).toBe('16px');
    });

    it('centers round icon within the declared badge icon box', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'icon', 'check_circle');
      const icon = queryByCss<HTMLElement>(fixture, 'sd-icon.c-material-icon');
      const style = getComputedStyle(icon);

      expect(style.display).toContain('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.width).toBe('16px');
      expect(style.height).toBe('16px');
    });
  });

  describe('container size modifier (round + tag)', () => {
    it('round size="sm" → c-badge--sm on container (default)', () => {
      setInput(fixture, 'type', 'round');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-badge--sm')).toBe(true);
    });

    it('round size="md" → c-badge--md on container', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'size', 'md');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-badge--md')).toBe(true);
    });

    it('round size="lg" → c-badge--lg on container', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'size', 'lg');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-badge--lg')).toBe(true);
    });

    it('tag size="lg" → c-badge--lg on container', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'size', 'lg');
      const el = queryByCss<HTMLDivElement>(fixture, 'div.c-badge--tag');
      expect(el.classList.contains('c-badge--lg')).toBe(true);
    });
  });

  describe('round type — icon support', () => {
    it('does NOT render icon element when icon input is not set', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'title', 'X');
      expect(fixture.nativeElement.querySelector('sd-icon.c-material-icon')).toBeNull();
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-badge--has-icon')).toBe(false);
    });

    it('renders icon element when icon is set on round type', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'icon', 'check_circle');
      setInput(fixture, 'title', 'OK');
      const iconSpan = fixture.nativeElement.querySelector('sd-icon.c-material-icon');
      expect(iconSpan).not.toBeNull();
      expect(iconSpan.textContent?.trim()).toBe('check_circle');
      expect(queryByCss<HTMLDivElement>(fixture, 'div.c-badge').classList.contains('c-badge--has-icon')).toBe(true);
    });

    it('round icon element gets size class (c-md) matching size input', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'icon', 'check_circle');
      setInput(fixture, 'size', 'md');
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').classList.contains('c-md')).toBe(true);
    });

    it('round icon element gets color class (success) from baseColorClasses', () => {
      setInput(fixture, 'type', 'round');
      setInput(fixture, 'icon', 'check_circle');
      setInput(fixture, 'success', true);
      expect(queryByCss(fixture, 'sd-icon.c-material-icon').classList.contains('c-success')).toBe(true);
    });
  });

  describe('icon renderer configuration', () => {
    it('uses SdIcon default fontSet when fontSet is not provided', () => {
      setInput(fixture, 'type', 'icon');
      const icon = getIconComponent();

      expect(icon.resolvedFontSet()).toBe('material-icons-outlined');
    });

    it('passes fontSet to SdIcon', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'fontSet', 'material-icons');
      const icon = getIconComponent();

      expect(icon.resolvedFontSet()).toBe('material-icons');
    });

    it('lets fontSet override the Material icon font set', () => {
      setInput(fixture, 'type', 'icon');
      setInput(fixture, 'fontSet', 'material-icons-round');
      const icon = getIconComponent();

      expect(icon.resolvedFontSet()).toBe('material-icons-round');
    });

    it('passes fontSet to tag and round badge icons', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'icon', 'label');
      setInput(fixture, 'fontSet', 'material-icons');
      expect(getIconComponent().resolvedFontSet()).toBe('material-icons');

      setInput(fixture, 'type', 'round');
      setInput(fixture, 'icon', 'check_circle');
      expect(getIconComponent().resolvedFontSet()).toBe('material-icons');
    });

    it('coerces falsy fontSet to undefined so SdIcon can use its configuration', () => {
      setInput(fixture, 'fontSet', null);

      expect(fixture.componentInstance.fontSet()).toBeUndefined();
    });
  });

  describe('tag type — icon visibility branch', () => {
    it('renders icon element ONLY when icon input is set', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'title', 'T');
      // No icon input → @if (icon()) branch false
      expect(fixture.nativeElement.querySelector('sd-icon.c-material-icon')).toBeNull();
    });

    it('renders icon element in tag type when icon is set', () => {
      setInput(fixture, 'type', 'tag');
      setInput(fixture, 'title', 'T');
      setInput(fixture, 'icon', 'label');
      expect(fixture.nativeElement.querySelector('sd-icon.c-material-icon')).not.toBeNull();
    });
  });

  describe('tooltip', () => {
    it('reads tooltip() input value', () => {
      setInput(fixture, 'tooltip', 'My tooltip');
      expect(fixture.componentInstance.tooltip()).toBe('My tooltip');
    });

    it('handles null tooltip (template falls back to empty string)', () => {
      setInput(fixture, 'tooltip', null);
      expect(fixture.componentInstance.tooltip()).toBeNull();
    });
  });
});
