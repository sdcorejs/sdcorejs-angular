import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LucideDownload } from '@lucide/angular';
import { provideSdIcon, SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdButton } from './button.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdButton', () => {
  let fixture: ComponentFixture<SdButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdButton, NoopAnimationsModule],
      providers: [provideSdIcon({ lucideIcons: [LucideDownload] })],
    }).compileComponents();

    fixture = TestBed.createComponent(SdButton);
  });

  describe('creation', () => {
    it('renders with default type "light"', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button.c-light')).not.toBeNull();
    });

    it('renders correct variant for each type', () => {
      const variants: [string, string][] = [
        ['fill', 'c-fill'],
        ['light', 'c-light'],
        ['outline', 'c-outline'],
        ['text', 'c-text'],
      ];
      for (const [type, cls] of variants) {
        setInput(fixture, 'type', type);
        expect(fixture.nativeElement.querySelector(`button.${cls}`)).not.toBeNull();
      }
    });

    it('renders title text', () => {
      setInput(fixture, 'title', 'Lưu');
      expect(queryByCss(fixture, 'span.c-title').textContent?.trim()).toBe('Lưu');
    });

    it('renders prefix icon when provided', () => {
      setInput(fixture, 'prefixIcon', 'save');
      setInput(fixture, 'title', 'X');
      expect(queryByCss(fixture, 'sd-icon.c-icon-prefix mat-icon').textContent?.trim()).toBe('save');
    });

    it('lets fontSet choose Material filled', () => {
      setInput(fixture, 'prefixIcon', 'add');
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'fontSet', 'material-icons');

      const icon = fixture.debugElement.query(By.directive(SdIcon)).componentInstance as SdIcon;
      expect(icon.resolvedFontSet()).toBe('material-icons');
    });

    // why: bug "text dài button bị xuống hàng cắt height" — fix bằng nowrap + ellipsis
    // trên .c-title + min-width:0 cho flex wrapper.
    it('applies nowrap + ellipsis on .c-title so long text never wraps to 2 lines', () => {
      setInput(fixture, 'title', 'Khôi phục mặc định');
      fixture.detectChanges();
      const title = queryByCss(fixture, 'span.c-title');
      const cs = getComputedStyle(title);
      expect(cs.whiteSpace).toBe('nowrap');
      expect(cs.textOverflow).toBe('ellipsis');
      expect(cs.overflow).toBe('hidden');
    });

    it('applies nowrap on the button itself so MDC label cannot break to 2 lines', () => {
      setInput(fixture, 'title', 'Lưu & Tải lại');
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button.c-button') as HTMLElement;
      expect(getComputedStyle(btn).whiteSpace).toBe('nowrap');
    });
  });

  describe('booleanAttribute coercion', () => {
    it('coerces "disabled" bare attribute to true via setInput("")', () => {
      setInput(fixture, 'disabled', '');
      expect(fixture.componentInstance.disabled()).toBe(true);
    });

    it('disabled=true applies .sd-disabled host class', () => {
      setInput(fixture, 'disabled', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-disabled')).toBe(true);
    });

    it('loading=true applies .sd-loading host class', () => {
      setInput(fixture, 'loading', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-loading')).toBe(true);
    });

    it('block=true applies .sd-block host class', () => {
      setInput(fixture, 'block', true);
      expect((fixture.nativeElement as HTMLElement).classList.contains('sd-block')).toBe(true);
    });
  });

  describe('loading state', () => {
    it('renders spinner instead of prefix icon when loading=true', () => {
      setInput(fixture, 'prefixIcon', 'save');
      setInput(fixture, 'loading', true);
      expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('sd-icon.c-icon-prefix')).toBeNull();
    });
  });

  describe('icon-only square class', () => {
    it('applies c-square when only icon (no title)', () => {
      setInput(fixture, 'prefixIcon', 'add');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-square')).toBe(true);
    });

    it('does NOT apply c-square when has title', () => {
      setInput(fixture, 'prefixIcon', 'add');
      setInput(fixture, 'title', 'New');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-square')).toBe(false);
    });

    it('names an icon-only button with its tooltip for every variant', () => {
      setInput(fixture, 'prefixIcon', 'file_download');
      setInput(fixture, 'tooltip', 'Download report');
      for (const type of ['fill', 'light', 'outline', 'text']) {
        setInput(fixture, 'type', type);
        expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').getAttribute('aria-label'))
          .withContext(type)
          .toBe('Download report');
      }
    });

    it('keeps the visible title as the accessible name when a title is present', () => {
      setInput(fixture, 'prefixIcon', 'add');
      setInput(fixture, 'title', 'New');
      setInput(fixture, 'tooltip', 'Create a record');
      expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('size class', () => {
    it('applies c-sm by default', () => {
      setInput(fixture, 'title', 'X');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.classList.contains('c-sm')).toBe(true);
    });

    it('applies c-md when size="md"', () => {
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'size', 'md');
      expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').classList.contains('c-md')).toBe(true);
    });

    it('applies c-lg when size="lg"', () => {
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'size', 'lg');
      expect(queryByCss<HTMLButtonElement>(fixture, 'button.c-button').classList.contains('c-lg')).toBe(true);
    });
  });

  describe('indicator (wave 2 · F)', () => {
    const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const indicator = (): HTMLElement | null => host().querySelector<HTMLElement>(':scope > .sd-button__indicator');
    const nativeButton = (): HTMLButtonElement => host().querySelector<HTMLButtonElement>('button.c-button')!;

    beforeEach(() => {
      // Distinct colours so the colour rules are checked without loading the theme.
      const style = host().style;
      style.setProperty('--sd-error', 'rgb(200, 0, 0)');
      style.setProperty('--sd-error-contrast', 'rgb(255, 255, 255)');
      style.setProperty('--sd-success', 'rgb(0, 120, 0)');
      style.setProperty('--sd-success-contrast', 'rgb(250, 250, 250)');
      style.setProperty('--sd-disabled-text', 'rgb(100, 100, 100)');
      style.setProperty('--sd-surface', 'rgb(254, 254, 254)');
      style.setProperty('--sd-button-indicator-ring', 'rgb(1, 2, 3)');
      setInput(fixture, 'prefixIcon', 'notifications');
      setInput(fixture, 'tooltip', 'Thông báo');
    });

    it('renders nothing for null, false, 0, a negative number or NaN', () => {
      for (const value of [null, false, 0, -3, Number.NaN]) {
        setInput(fixture, 'indicator', value);
        expect(indicator()).withContext(String(value)).toBeNull();
      }
    });

    it('renders a dot for true and the floored number for a positive number, capped by indicatorMax', () => {
      setInput(fixture, 'indicator', true);
      expect(indicator()!.classList).toContain('sd-button__indicator--dot');
      expect(indicator()!.textContent?.trim()).toBe('');

      setInput(fixture, 'indicator', 3.9);
      expect(indicator()!.classList).toContain('sd-button__indicator--count');
      expect(indicator()!.textContent?.trim()).toBe('3');

      setInput(fixture, 'indicator', 120);
      expect(indicator()!.textContent?.trim()).toBe('99+');

      setInput(fixture, 'indicatorMax', 9);
      setInput(fixture, 'indicator', 12);
      expect(indicator()!.textContent?.trim()).toBe('9+');
    });

    it('sits next to the native button, aria-hidden, without pointer events or a change of button size', () => {
      const before = nativeButton().getBoundingClientRect();
      setInput(fixture, 'indicator', 42);
      const element = indicator()!;
      expect(element.parentElement).toBe(host());
      expect(nativeButton().contains(element)).toBeFalse();
      expect(element.getAttribute('aria-hidden')).toBe('true');
      expect(getComputedStyle(element).pointerEvents).toBe('none');
      const after = nativeButton().getBoundingClientRect();
      expect([after.width, after.height, after.top, after.left]).toEqual([before.width, before.height, before.top, before.left]);
    });

    it('uses the error colour by default, indicatorColor otherwise, and a ring of --sd-button-indicator-ring', () => {
      setInput(fixture, 'indicator', 5);
      let style = getComputedStyle(indicator()!);
      expect(style.backgroundColor).toBe('rgb(200, 0, 0)');
      expect(style.color).toBe('rgb(255, 255, 255)');
      expect(style.boxShadow).toBe('rgb(1, 2, 3) 0px 0px 0px 2px');
      setInput(fixture, 'indicatorColor', 'success');
      style = getComputedStyle(indicator()!);
      expect(style.backgroundColor).toBe('rgb(0, 120, 0)');
      expect(style.color).toBe('rgb(250, 250, 250)');
    });

    it('turns grey with the button disabled and stays while loading', () => {
      setInput(fixture, 'indicator', 5);
      setInput(fixture, 'disabled', true);
      expect(getComputedStyle(indicator()!).backgroundColor).toBe('rgb(100, 100, 100)');
      expect(getComputedStyle(indicator()!).color).toBe('rgb(254, 254, 254)');
      setInput(fixture, 'disabled', false);
      setInput(fixture, 'loading', true);
      expect(indicator()).withContext('loading keeps the indicator').not.toBeNull();
    });

    it('describes the native button with indicatorLabel without replacing its accessible name', () => {
      setInput(fixture, 'indicator', 3);
      expect(nativeButton().hasAttribute('aria-describedby')).toBeFalse();
      setInput(fixture, 'indicatorLabel', '3 thông báo mới');
      const describedBy = nativeButton().getAttribute('aria-describedby')!;
      const description = host().querySelector<HTMLElement>(`[id="${describedBy}"]`)!;
      expect(description.textContent?.trim()).toBe('3 thông báo mới');
      expect(description.getBoundingClientRect().width).withContext('visually hidden').toBeLessThanOrEqual(1);
      expect(nativeButton().getAttribute('aria-label')).toBe('Thông báo');
      expect(description.closest('[aria-live]')).withContext('no live region').toBeNull();
      setInput(fixture, 'indicator', null);
      expect(nativeButton().hasAttribute('aria-describedby')).withContext('no indicator, no description').toBeFalse();
    });

    // Anchor a = 0.146 × button height (the 45° point of the top-end corner arc): 4.7 / 5.9 / 7px.
    for (const [size, height, dot, count] of [
      ['sm', 32, 8, 16],
      ['md', 40, 8, 18],
      ['lg', 48, 10, 20],
    ] as const) {
      it(`places the ${size} dot and number on the corner anchor`, () => {
        setInput(fixture, 'size', size);
        const anchor = 0.146 * height;
        setInput(fixture, 'indicator', true);
        const button = nativeButton().getBoundingClientRect();
        const dotBox = indicator()!.getBoundingClientRect();
        expect(dotBox.width).toBeCloseTo(dot, 0);
        expect(dotBox.left + dotBox.width / 2).toBeCloseTo(button.right - anchor, 0);
        expect(dotBox.top + dotBox.height / 2).toBeCloseTo(button.top + anchor, 0);

        setInput(fixture, 'indicator', 7);
        const countBox = indicator()!.getBoundingClientRect();
        expect(countBox.height).toBeCloseTo(count, 0);
        expect(countBox.width).toBeGreaterThanOrEqual(count - 0.5);
        expect(countBox.left).toBeCloseTo(button.right - anchor - count / 2, 0);
        expect(countBox.top + countBox.height / 2).toBeCloseTo(button.top + anchor, 0);
      });
    }
  });

  describe('autoId computed', () => {
    it('returns undefined when autoId input is null', () => {
      setInput(fixture, 'autoId', null);
      expect(fixture.componentInstance.autoId()).toBeUndefined();
    });

    it('prefixes autoId input with "components-button-"', () => {
      setInput(fixture, 'autoId', 'save');
      expect(fixture.componentInstance.autoId()).toBe('components-button-save');
    });

    it('renders data-autoId attribute on button', () => {
      setInput(fixture, 'autoId', 'save');
      setInput(fixture, 'title', 'X');
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.getAttribute('data-autoid')).toBe('components-button-save');
    });
  });

  describe('click output (throttle 300ms)', () => {
    it('emits click event when not disabled/loading', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(0);
      expect(received.length).toBe(1);
    }));

    it('throttles rapid clicks to once per 300ms (leading edge)', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      btn.click();
      btn.click();
      tick(100);
      expect(received.length).toBe(1);

      tick(300);
      btn.click();
      tick(0);
      expect(received.length).toBe(2);
    }));

    it('does NOT emit when disabled', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'disabled', true);

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(500);
      expect(received.length).toBe(0);
    }));

    it('does NOT emit when loading', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');
      setInput(fixture, 'loading', true);

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      btn.click();
      tick(500);
      expect(received.length).toBe(0);
    }));
  });

  describe('cleanup', () => {
    it('unsubscribes on destroy (no emit after destroy)', fakeAsync(() => {
      const received: Event[] = [];
      fixture.componentInstance.click.subscribe(e => received.push(e));
      setInput(fixture, 'title', 'X');

      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      fixture.destroy();

      // sau destroy, internal click không còn route — chỉ verify destroy không throw
      expect(() => btn.click()).not.toThrow();
      tick(500);
      expect(received.length).toBe(0);
    }));
  });

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting disabled input', () => {
      setInput(fixture, 'autoId', 'save');
      setInput(fixture, 'type', 'fill');
      fixture.detectChanges();
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.getAttribute('data-disabled')).toBe('false');

      setInput(fixture, 'disabled', true);
      fixture.detectChanges();
      expect(btn.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-loading reflecting loading input', () => {
      setInput(fixture, 'autoId', 'save');
      setInput(fixture, 'type', 'fill');
      fixture.detectChanges();
      const btn = queryByCss<HTMLButtonElement>(fixture, 'button.c-button');
      expect(btn.getAttribute('data-loading')).toBe('false');

      setInput(fixture, 'loading', true);
      fixture.detectChanges();
      expect(btn.getAttribute('data-loading')).toBe('true');
    });
  });
  describe('theme and icon layout', () => {
    it('renders a suffix-only action once and replaces it while loading', () => {
      setInput(fixture, 'suffixIcon', 'more_vert');
      expect(fixture.nativeElement.querySelectorAll('sd-icon').length).toBe(1);
      setInput(fixture, 'loading', true);
      expect(fixture.nativeElement.querySelectorAll('sd-icon').length).toBe(0);
      expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    });

    it('visually mutes only disabled secondary icon-only text buttons', () => {
      setInput(fixture, 'type', 'text');
      setInput(fixture, 'color', 'secondary');
      setInput(fixture, 'prefixIcon', 'download');
      const host = fixture.nativeElement as HTMLElement;
      const icon = () => host.querySelector('sd-icon')!;
      expect(getComputedStyle(icon()).opacity).toBe('1');

      setInput(fixture, 'disabled', true);
      expect(host.querySelector('button')!.disabled).toBeTrue();
      expect(getComputedStyle(icon()).opacity).toBe('0.5');
      setInput(fixture, 'prefixIcon', undefined);
      setInput(fixture, 'suffixIcon', 'download');
      setInput(fixture, 'fontSet', 'lucide');
      expect(getComputedStyle(icon()).opacity).toBe('0.5');

      setInput(fixture, 'type', 'light');
      expect(getComputedStyle(icon()).opacity).toBe('1');
      setInput(fixture, 'type', 'text');
      setInput(fixture, 'title', 'Download');
      expect(getComputedStyle(icon()).opacity).toBe('1');
      setInput(fixture, 'title', undefined);
      setInput(fixture, 'color', 'primary');
      expect(getComputedStyle(icon()).opacity).toBe('1');
      setInput(fixture, 'color', 'secondary');
      setInput(fixture, 'disabled', false);
      expect(getComputedStyle(icon()).opacity).toBe('1');
      setInput(fixture, 'loading', true);
      expect(host.querySelector('sd-icon')).toBeNull();
      expect(getComputedStyle(host.querySelector('mat-spinner')!).opacity).toBe('1');
    });

    it('updates outline and disabled colors when the containing theme changes', () => {
      setInput(fixture, 'type', 'outline');
      setInput(fixture, 'color', 'secondary');
      setInput(fixture, 'title', 'Export');
      const host = fixture.nativeElement as HTMLElement;
      const button = host.querySelector('button')!;
      host.style.setProperty('--sd-surface', 'rgb(250, 250, 250)');
      const expectBorder = (expected: number[]) => {
        const value = getComputedStyle(button).borderTopColor;
        const numbers = value.match(/[\d.]+/g)!.map(Number);
        const channels = value.startsWith('color(') ? numbers.slice(-3).map(channel => channel * 255) : numbers.slice(0, 3);
        channels.forEach((channel, index) => expect(channel).toBeCloseTo(expected[index], 2));
      };
      host.style.setProperty('--sd-border-strong', 'rgb(92, 101, 120)');
      expectBorder([114.12, 121.86, 138.2]);
      host.style.setProperty('--sd-border-strong', 'rgb(190, 201, 220)');
      expectBorder([198.4, 207.86, 224.2]);
      host.style.setProperty('--sd-disabled-text', 'rgb(151, 162, 183)');
      host.style.setProperty('--sd-disabled-bg', 'rgb(43, 51, 66)');
      setInput(fixture, 'disabled', true);
      expect(getComputedStyle(button).color).toBe('rgb(151, 162, 183)');
      expect(getComputedStyle(button).opacity).toBe('1');
      expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      setInput(fixture, 'type', 'fill');
      const filled = host.querySelector('button')!;
      expect(getComputedStyle(filled).color).toBe('rgb(151, 162, 183)');
      expect(getComputedStyle(filled).backgroundColor).toBe('rgb(43, 51, 66)');
    });
  });
});
