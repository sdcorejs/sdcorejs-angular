import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** Pull distance that triggers a refresh. */
export const SD_TABLE_PULL_DISTANCE = 64;
/** The indicator stops following the finger here. */
const MAX_PULL = 96;

/**
 * Pull to refresh on the phone cards (handoff table-mobile 7). Listens to touches on `target` (the card list); only a
 * pull that starts with the list at the top, while no sheet is open, counts. Past `SD_TABLE_PULL_DISTANCE` the release
 * emits `refresh`; the indicator stays until `loading` turns false. Listeners are passive.
 */
@Component({
  selector: 'sd-table-pull-refresh',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdTranslatePipe],
  template: `
    @let _distance = distance();
    @if (_distance > 0 || refreshing()) {
      <div
        class="sd-pull-indicator"
        [class.sd-pull-indicator--ready]="_distance >= threshold"
        [class.sd-pull-indicator--busy]="refreshing()"
        [style.transform]="'translate(-50%, ' + (refreshing() ? threshold / 2 : _distance / 2) + 'px)'"
        role="status"
        [attr.aria-label]="
          (_distance >= threshold ? 'core.component.table.mobile.refresh-release' : 'core.component.table.mobile.refresh-pull')
            | sdTranslate
        ">
        <sd-icon name="refresh" size="22px" [style.transform]="refreshing() ? null : 'rotate(' + _distance * 4 + 'deg)'"></sd-icon>
      </div>
    }
  `,
  styleUrl: './pull-refresh.component.scss',
})
export class SdTablePullRefreshComponent {
  readonly target = input<HTMLElement>();
  readonly enabled = input(false);
  readonly loading = input(false);
  readonly refresh = output<void>();
  readonly distance = signal(0);
  readonly refreshing = signal(false);
  readonly threshold = SD_TABLE_PULL_DISTANCE;
  readonly #overlay = inject(OverlayContainer);
  #start?: number;

  constructor() {
    effect(onCleanup => {
      const target = this.target();
      if (!target || !this.enabled()) return;
      const options: AddEventListenerOptions = { passive: true };
      const start = (event: TouchEvent) => {
        this.#start = this.#atTop(target) && !this.#sheetOpen() && event.touches.length === 1 ? event.touches[0].clientY : undefined;
      };
      const move = (event: TouchEvent) => {
        if (this.#start === undefined || this.refreshing()) return;
        const pulled = event.touches[0].clientY - this.#start;
        // why: a pull that turns into a scroll (list no longer at the top) stops counting.
        if (pulled <= 0 || !this.#atTop(target)) {
          this.distance.set(0);
          return;
        }
        this.distance.set(Math.min(pulled, MAX_PULL));
      };
      const end = () => {
        const ready = this.distance() >= SD_TABLE_PULL_DISTANCE;
        this.#start = undefined;
        this.distance.set(0);
        if (!ready) return;
        this.refreshing.set(true);
        this.refresh.emit();
        // why: a read that never shows as loading (nothing to fetch) must not leave the indicator spinning.
        setTimeout(() => !this.loading() && this.refreshing.set(false), 300);
      };
      target.addEventListener('touchstart', start, options);
      target.addEventListener('touchmove', move, options);
      target.addEventListener('touchend', end, options);
      target.addEventListener('touchcancel', end, options);
      onCleanup(() => {
        target.removeEventListener('touchstart', start);
        target.removeEventListener('touchmove', move);
        target.removeEventListener('touchend', end);
        target.removeEventListener('touchcancel', end);
      });
    });
    // The indicator stays until the read it started is done.
    effect(() => {
      if (!this.loading()) this.refreshing.set(false);
    });
    inject(DestroyRef).onDestroy(() => (this.#start = undefined));
  }

  /** The list and every scrolling ancestor are at their top. */
  #atTop(target: HTMLElement): boolean {
    for (let node: HTMLElement | null = target; node; node = node.parentElement) {
      if (node.scrollTop > 0) return false;
    }
    return (target.ownerDocument.scrollingElement?.scrollTop ?? 0) <= 0;
  }

  #sheetOpen(): boolean {
    return !!this.#overlay.getContainerElement().querySelector('.cdk-overlay-backdrop');
  }
}
