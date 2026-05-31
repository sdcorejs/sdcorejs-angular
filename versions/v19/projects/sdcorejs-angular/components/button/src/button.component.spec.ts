import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton } from './button.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdButton', () => {
  let fixture: ComponentFixture<SdButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdButton, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdButton);
  });

  describe('creation', () => {
    it('renders with default type "light"', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('button.c-light')).not.toBeNull();
    });

    it('renders correct variant for each type', () => {
      const variants: Array<[string, string]> = [
        ['fill', 'c-fill'],
        ['light', 'c-light'],
        ['outline', 'c-outline'],
        ['link', 'c-link'],
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
      expect(queryByCss(fixture, 'mat-icon.c-icon-prefix').textContent?.trim()).toBe('save');
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
      expect(fixture.nativeElement.querySelector('mat-icon.c-icon-prefix')).toBeNull();
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
});
