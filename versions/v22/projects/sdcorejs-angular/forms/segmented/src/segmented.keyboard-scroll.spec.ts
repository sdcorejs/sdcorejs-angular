import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdSegmentedComponent } from './segmented.component';
import { SdSegmentedItem, SdSegmentedModel, SdSegmentedOption } from './segmented.model';

// Real-browser layout regression for keyboard navigation inside a scrolling segmented-control track.
// The host supplies the focus-ring tokens: library Karma loads no theme, and the outline shorthand's
// `var(--sd-focus-ring-color)` (no fallback) would otherwise make the whole outline invalid (width 0).
/** `--sd-focus-ring-width` + `--sd-focus-ring-offset` below; used when Chrome does not report `:focus-visible`. */
const TOKEN_RING = 4;
/** Tolerance for "aligned to the edge" (sub-pixel label widths). */
const EDGE = 1;
/** Tolerance for "entirely inside" the clipping box. */
const INSIDE = 0.5;

function choices(count: number, disabled: readonly number[] = []): readonly SdSegmentedItem<string>[] {
  return Array.from({ length: count }, (_, index) => ({
    value: `item-${index}`,
    label: `Choice ${String(index + 1).padStart(2, '0')}`,
    disabled: disabled.includes(index),
  }));
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdSegmentedComponent],
  template: `
    <div class="ancestor" [style.width.px]="width() + 40">
      <div class="frame" [style.width.px]="width()" [attr.dir]="dir()">
        <sd-segmented class="subject" ariaLabel="Scroll subject" [items]="items()" [option]="option()" [(model)]="model" />
      </div>
      @if (withOther()) {
        <div class="frame" [style.width.px]="width()">
          <sd-segmented class="other" ariaLabel="Other control" [items]="items()" [(model)]="otherModel" />
        </div>
      }
      <div class="spacer"></div>
    </div>
    <button type="button" class="outside">Outside</button>
  `,
  styles: `
    :host {
      display: block;
      --sd-focus-ring-color: rgb(0, 92, 187);
      --sd-focus-ring-width: 2px;
      --sd-focus-ring-offset: 2px;
    }
    .ancestor {
      height: 160px;
      overflow: auto;
    }
    .spacer {
      height: 400px;
    }
    sd-segmented {
      display: block;
    }
  `,
})
class ScrollHost {
  readonly width = signal(240);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly items = signal(choices(8));
  readonly option = signal<SdSegmentedOption>({});
  readonly withOther = signal(false);
  readonly model = signal<SdSegmentedModel<string>>('item-0');
  readonly otherModel = signal<SdSegmentedModel<string>>('item-0');
}

describe('SdSegmentedComponent keyboard scrolling', () => {
  let fixture: ComponentFixture<ScrollHost>;
  const host = () => fixture.componentInstance;
  const root = () => fixture.nativeElement as HTMLElement;
  const subject = () => root().querySelector('sd-segmented.subject') as HTMLElement;
  const track = (control: HTMLElement = subject()) => control.querySelector('.sd-segmented') as HTMLElement;
  const items = (control: HTMLElement = subject()) => Array.from(control.querySelectorAll<HTMLButtonElement>('.sd-segmented__item'));
  const ancestor = () => root().querySelector('.ancestor') as HTMLElement;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    // Two frames cover an implementation that defers its scroll until after render.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    fixture.detectChanges();
    await fixture.whenStable();
  }
  async function render(configure: (scrollHost: ScrollHost) => void = () => undefined): Promise<void> {
    await TestBed.configureTestingModule({ imports: [ScrollHost] }).compileComponents();
    fixture = TestBed.createComponent(ScrollHost);
    configure(fixture.componentInstance);
    await settle();
  }
  function press(target: HTMLElement, key: string): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }
  /** The scroll container's clipping box (padding box without scrollbars) in viewport coordinates. */
  function clip(container: HTMLElement = track()) {
    const rect = container.getBoundingClientRect();
    const left = rect.left + container.clientLeft;
    const top = rect.top + container.clientTop;
    return { left, top, right: left + container.clientWidth, bottom: top + container.clientHeight };
  }
  /** The choice's border box grown by its computed outward focus outline. */
  function ring(button: HTMLButtonElement) {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    // Script focus usually matches :focus-visible in Chrome without prior pointer input; if the heuristic
    // does not match, fall back to the token values the outline is built from instead of measuring 0.
    const extent =
      button.matches(':focus-visible') && style.outlineStyle !== 'none'
        ? parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset)
        : TOKEN_RING;
    expect(extent).withContext('focus ring extent').toBeGreaterThan(0);
    return { left: rect.left - extent, right: rect.right + extent, top: rect.top - extent, bottom: rect.bottom + extent };
  }
  function fullyVisible(button: HTMLButtonElement, container: HTMLElement = track()): boolean {
    const outer = ring(button);
    const box = clip(container);
    return (
      outer.left >= box.left - INSIDE &&
      outer.right <= box.right + INSIDE &&
      outer.top >= box.top - INSIDE &&
      outer.bottom <= box.bottom + INSIDE
    );
  }
  function expectFullyVisible(button: HTMLButtonElement, context: string, container: HTMLElement = track()): void {
    const outer = ring(button);
    const box = clip(container);
    expect(outer.left)
      .withContext(`${context}: ring left`)
      .toBeGreaterThanOrEqual(box.left - INSIDE);
    expect(outer.right)
      .withContext(`${context}: ring right`)
      .toBeLessThanOrEqual(box.right + INSIDE);
    expect(outer.top)
      .withContext(`${context}: ring top`)
      .toBeGreaterThanOrEqual(box.top - INSIDE);
    expect(outer.bottom)
      .withContext(`${context}: ring bottom`)
      .toBeLessThanOrEqual(box.bottom + INSIDE);
  }

  it('reveals the whole End and Home choice and ring inside its own horizontal track with minimal scroll', async () => {
    await render();
    const scroller = track();
    const buttons = items();
    const last = buttons[buttons.length - 1];
    expect(scroller.scrollWidth).withContext('fixture overflows').toBeGreaterThan(scroller.clientWidth);
    expect(fullyVisible(last)).withContext('End target starts hidden').toBeFalse();

    buttons[0].focus();
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expect(host().model()).toBe('item-7');
    expectFullyVisible(last, 'End');
    expect(Math.abs(ring(last).right - clip(scroller).right))
      .withContext('End scrolls minimally')
      .toBeLessThanOrEqual(EDGE);

    press(last, 'Home');
    await settle();
    expect(document.activeElement).toBe(buttons[0]);
    expect(host().model()).toBe('item-0');
    expectFullyVisible(buttons[0], 'Home');
    expect(scroller.scrollLeft).withContext('Home returns to the start').toBeLessThanOrEqual(EDGE);
  });

  it('keeps every ArrowRight target visible, skips disabled choices, and only scrolls when needed', async () => {
    await render(scrollHost => scrollHost.items.set(choices(8, [2])));
    const scroller = track();
    const buttons = items();
    const enabled = buttons.filter(button => !button.disabled);
    expect(enabled).toHaveSize(7);
    expect(fullyVisible(enabled[enabled.length - 1]))
      .withContext('later targets start hidden')
      .toBeFalse();

    buttons[0].focus();
    for (let step = 1; step < enabled.length; step++) {
      const from = enabled[step - 1];
      const to = enabled[step];
      const context = `ArrowRight to ${to.textContent!.trim()}`;
      const wasVisible = fullyVisible(to);
      const before = scroller.scrollLeft;
      press(from, 'ArrowRight');
      await settle();
      expect(document.activeElement).withContext(context).toBe(to);
      expect(host().model())
        .withContext(context)
        .toBe(`item-${buttons.indexOf(to)}`);
      expectFullyVisible(to, context);
      if (wasVisible) expect(scroller.scrollLeft).withContext(`${context}: visible target does not shift`).toBe(before);
      else
        expect(Math.abs(ring(to).right - clip(scroller).right))
          .withContext(`${context}: minimal scroll`)
          .toBeLessThanOrEqual(EDGE);
    }
  });

  it('reveals End and Home targets in an RTL track', async () => {
    await render(scrollHost => scrollHost.dir.set('rtl'));
    const scroller = track();
    const buttons = items();
    const last = buttons[buttons.length - 1];
    expect(getComputedStyle(subject()).direction).toBe('rtl');
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
    expect(fullyVisible(last)).toBeFalse();

    buttons[0].focus();
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expectFullyVisible(last, 'RTL End');
    expect(Math.abs(ring(last).left - clip(scroller).left))
      .withContext('RTL End scrolls minimally')
      .toBeLessThanOrEqual(EDGE);
    expect(scroller.scrollLeft).withContext('RTL scrolls toward the inline end').toBeLessThan(0);

    press(last, 'Home');
    await settle();
    expect(document.activeElement).toBe(buttons[0]);
    expectFullyVisible(buttons[0], 'RTL Home');
    expect(scroller.scrollLeft).toBeGreaterThanOrEqual(-EDGE);
  });

  it('scrolls a height-bounded vertical track on its block axis only', async () => {
    await render(scrollHost => scrollHost.option.set({ orientation: 'vertical' }));
    const scroller = track();
    // A consumer bounding the vertical control; the library leaves its height to content.
    scroller.style.maxHeight = '140px';
    await settle();
    const buttons = items();
    const last = buttons[buttons.length - 1];
    expect(scroller.scrollHeight).withContext('fixture overflows vertically').toBeGreaterThan(scroller.clientHeight);
    expect(scroller.scrollWidth).withContext('no horizontal overflow').toBeLessThanOrEqual(scroller.clientWidth);
    expect(fullyVisible(last)).toBeFalse();

    buttons[0].focus();
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expectFullyVisible(last, 'vertical End');
    expect(Math.abs(ring(last).bottom - clip(scroller).bottom))
      .withContext('vertical End scrolls minimally')
      .toBeLessThanOrEqual(EDGE);
    expect(scroller.scrollLeft).toBe(0);

    press(last, 'Home');
    await settle();
    expect(document.activeElement).toBe(buttons[0]);
    expectFullyVisible(buttons[0], 'vertical Home');
    expect(scroller.scrollTop).toBeLessThanOrEqual(EDGE);
  });

  it('reveals multiple-mode focus targets without changing the model', async () => {
    const selected: readonly string[] = ['item-0'];
    await render(scrollHost => {
      scrollHost.option.set({ multiple: true });
      scrollHost.model.set(selected);
    });
    const buttons = items();
    const last = buttons[buttons.length - 1];
    expect(fullyVisible(last)).toBeFalse();

    buttons[0].focus();
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expectFullyVisible(last, 'multiple End');
    expect(last.getAttribute('aria-checked')).toBe('false');

    press(last, 'ArrowLeft');
    await settle();
    expect(document.activeElement).toBe(buttons[buttons.length - 2]);
    expectFullyVisible(buttons[buttons.length - 2], 'multiple ArrowLeft');
    expect(host().model()).toBe(selected);
  });

  it('scrolls only its own track: no page, ancestor or other-control scroll and no focus theft', async () => {
    await render(scrollHost => scrollHost.withOther.set(true));
    const scroller = track();
    const other = track(root().querySelector('sd-segmented.other') as HTMLElement);
    const buttons = items();
    const last = buttons[buttons.length - 1];
    other.scrollLeft = 40;
    ancestor().scrollTop = 20;
    buttons[0].focus({ preventScroll: true });
    expect(other.scrollLeft).withContext('other control precondition').toBe(40);
    expect(ancestor().scrollTop).withContext('partially scrolled ancestor precondition').toBe(20);
    const page = { x: window.scrollX, y: window.scrollY };

    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expect(scroller.scrollLeft).withContext('own track scrolls').toBeGreaterThan(0);
    expectFullyVisible(last, 'own track');
    expect(other.scrollLeft).withContext('other control').toBe(40);
    expect(ancestor().scrollTop).withContext('ancestor block axis').toBe(20);
    expect(ancestor().scrollLeft).withContext('ancestor inline axis').toBe(0);
    expect({ x: window.scrollX, y: window.scrollY }).withContext('page').toEqual(page);
  });

  // Guard (expected to pass before the repair): a track that already fits never shifts.
  it('does not shift a track whose choices already fit', async () => {
    await render(scrollHost => {
      scrollHost.width.set(900);
      scrollHost.items.set(choices(3));
    });
    const scroller = track();
    const buttons = items();
    expect(scroller.scrollWidth).toBeLessThanOrEqual(scroller.clientWidth);

    buttons[0].focus();
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(buttons[2]);
    expectFullyVisible(buttons[2], 'fitting End');
    expect(scroller.scrollLeft).toBe(0);
    press(buttons[2], 'Home');
    await settle();
    expect(scroller.scrollLeft).toBe(0);
  });

  // Guard for a deferred implementation: the latest navigation wins, and focus moved away is never stolen.
  it('lets the latest navigation win and never steals focus after it moves away', async () => {
    await render();
    host().model.set('item-7');
    await settle();
    const scroller = track();
    const buttons = items();
    const last = buttons[buttons.length - 1];
    scroller.scrollLeft = scroller.scrollWidth;
    const max = scroller.scrollLeft;
    expect(max).toBeGreaterThan(0);
    last.focus({ preventScroll: true });

    // Two navigations before Angular renders or any deferred work runs.
    press(last, 'Home');
    press(buttons[0], 'End');
    await settle();
    expect(document.activeElement).toBe(last);
    expect(host().model()).toBe('item-7');
    expectFullyVisible(last, 'latest navigation');
    expect(scroller.scrollLeft).toBeGreaterThanOrEqual(max - EDGE);

    const outside = root().querySelector('button.outside') as HTMLButtonElement;
    const page = { x: window.scrollX, y: window.scrollY };
    const ancestorTop = ancestor().scrollTop;
    press(last, 'Home');
    outside.focus({ preventScroll: true });
    await settle();
    expect(document.activeElement).withContext('focus stays where the user moved it').toBe(outside);
    expect(ancestor().scrollTop).toBe(ancestorTop);
    expect({ x: window.scrollX, y: window.scrollY }).toEqual(page);
  });

  describe('with consumer reduced-motion transitions', () => {
    const SCOPE = 'sd-segmented-test-reduced-motion';
    let style: HTMLStyleElement | undefined;

    /**
     * Representative reduced-motion CSS (`* { transition-duration: 0.01ms !important }`, all properties) plus the
     * 3px/0 outline Chrome computes before focus. The focus ring and selection then still report their start
     * values when the component measures, one frame before the settled 2px + 2px ring.
     */
    async function applyReducedMotion(): Promise<void> {
      style = document.createElement('style');
      style.textContent = `
        .${SCOPE} .sd-segmented__item { outline: 3px solid transparent; outline-offset: 0; }
        .${SCOPE} * { transition-property: all !important; transition-duration: 0.01ms !important; }
      `;
      document.head.appendChild(style);
      root().classList.add(SCOPE);
      await settle();
    }
    afterEach(() => {
      style?.remove();
      style = undefined;
    });
    /** Navigate, check the measurement-time ring is still transient, then settle. */
    async function navigate(from: HTMLButtonElement, key: string, to: HTMLButtonElement): Promise<void> {
      press(from, key);
      expect(getComputedStyle(to).outlineOffset).withContext(`${key}: ring is transient when measured`).toBe('0px');
      await settle();
      expect(document.activeElement).withContext(key).toBe(to);
    }
    /** The final ring, not a transition frame: settled tokens 2px + 2px, or the token fallback the helper uses. */
    function expectSettledRing(button: HTMLButtonElement, context: string): void {
      const rect = button.getBoundingClientRect();
      expect(rect.left - ring(button).left)
        .withContext(`${context}: settled ring`)
        .toBeCloseTo(TOKEN_RING, 3);
      expectFullyVisible(button, context);
    }

    it('keeps the full settled ring of first and last horizontal choices inside the track', async () => {
      await render();
      await applyReducedMotion();
      const scroller = track();
      const buttons = items();
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      expect(fullyVisible(last)).withContext('End target starts hidden').toBeFalse();

      first.focus();
      await navigate(first, 'End', last);
      expectSettledRing(last, 'reduced-motion End');
      expect(Math.abs(ring(last).right - clip(scroller).right))
        .withContext('reduced-motion End scrolls minimally')
        .toBeLessThanOrEqual(EDGE);

      await navigate(last, 'Home', first);
      expectSettledRing(first, 'reduced-motion Home');
      expect(scroller.scrollLeft).withContext('Home returns to the start').toBeLessThanOrEqual(EDGE);

      // Repeated Home on the already-focused first choice (its ring is settled now) must not move or clip it.
      const before = scroller.scrollLeft;
      press(first, 'Home');
      await settle();
      expect(document.activeElement).toBe(first);
      expectSettledRing(first, 'repeated Home');
      expect(scroller.scrollLeft).withContext('repeated Home does not shift').toBe(before);
    });

    it('keeps the full settled ring of first and last choices inside a height-bounded vertical track', async () => {
      await render(scrollHost => scrollHost.option.set({ orientation: 'vertical' }));
      const scroller = track();
      scroller.style.maxHeight = '140px';
      await applyReducedMotion();
      const buttons = items();
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      expect(scroller.scrollHeight).withContext('fixture overflows vertically').toBeGreaterThan(scroller.clientHeight);
      expect(fullyVisible(last)).toBeFalse();

      first.focus();
      await navigate(first, 'End', last);
      expectSettledRing(last, 'reduced-motion vertical End');
      expect(Math.abs(ring(last).bottom - clip(scroller).bottom))
        .withContext('reduced-motion vertical End scrolls minimally')
        .toBeLessThanOrEqual(EDGE);
      expect(scroller.scrollLeft).toBe(0);

      await navigate(last, 'Home', first);
      expectSettledRing(first, 'reduced-motion vertical Home');
      expect(scroller.scrollTop).toBeLessThanOrEqual(EDGE);
    });
  });
});
