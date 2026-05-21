import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdBadge } from './badge.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdBadge', () => {
  let fixture: ComponentFixture<SdBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdBadge, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdBadge);
  });

  describe('default render', () => {
    it('defaults type to "icon" with default icon fiber_manual_record', () => {
      fixture.detectChanges();
      const icon = queryByCss(fixture, 'span.c-material-icon');
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
      expect(fixture.nativeElement.querySelector('span.c-material-icon')).toBeNull();
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      expect(queryByCss(fixture, 'span.c-material-icon').textContent?.trim()).toBe('check_circle');
    });
  });
});
