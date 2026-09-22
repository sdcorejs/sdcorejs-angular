import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  ElementRef,
  HostBinding,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { Color } from '@sdcorejs/utils/models';
import { SdTab } from './tab.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

export interface SdTabClosedEvent {
  index: number;
  tab: SdTab;
}

export type SdTabRegionStyle = Readonly<Record<string, string | number | null | undefined>>;

@Component({
  selector: 'sd-tab-group',
  standalone: true,
  imports: [SdIcon, MatTabsModule, NgTemplateOutlet, SdTranslatePipe],
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTabGroup {
  tabs = contentChildren(SdTab);

  selectedIndex = model<number>(0);
  // why: visual style preset. 'line' = Material default (underline ink-bar);
  // 'pills' = rounded pill, active light (good for nested tab groups + filter bars);
  // 'segmented' = single bordered container, iOS-style.
  variant = input<'line' | 'pills' | 'segmented'>('line');
  // why: drives the active/indicator color via Core CSS vars (--sd-<color>, --sd-<color>-light).
  // Same palette consumers use on <sd-badge>, <sd-button>, etc — keeps theming consistent.
  color = input<Color>('primary');
  headerPosition = input<'above' | 'below'>('above');
  headerClass = input<string | null>();
  headerStyle = input<SdTabRegionStyle | null>();
  bodyClass = input<string | null>();
  bodyStyle = input<SdTabRegionStyle | null>();
  alignTabs = input<'start' | 'center' | 'end'>('start');
  // why: mat-tab-group defaults stretchTabs=true, which makes labels fill the row
  // and overrides alignTabs. Expose this so consumers can opt out and let alignTabs take effect.
  stretchTabs = input(true, { transform: booleanAttribute });
  animationDuration = input<string>('500ms');
  disableRipple = input(false, { transform: booleanAttribute });
  dynamicHeight = input(false, { transform: booleanAttribute });
  autoId = input<string | undefined>(undefined);

  tabClosed = output<SdTabClosedEvent>();

  readonly #closeRequests = new WeakMap<SdTab, Promise<boolean>>();

  protected matTabGroup = viewChild(MatTabGroup);
  private readonly matTabElement = viewChild(MatTabGroup, { read: ElementRef<HTMLElement> });

  @HostBinding('attr.data-autoId') get autoIdAttr(): string | null {
    return this.autoId() ?? null;
  }

  @HostBinding('class.sd-tab-group--pills') get isPills(): boolean {
    return this.variant() === 'pills';
  }
  @HostBinding('class.sd-tab-group--segmented') get isSegmented(): boolean {
    return this.variant() === 'segmented';
  }

  // why: bind Core color CSS vars onto the host so the existing --sd-tab-* CSS vars
  // pick up the chosen color. Fallback hex matches the values in autoid-inspector
  // for environments where the global Core SCSS isn't loaded (e.g. lib-only tests).
  @HostBinding('style.--sd-tab-indicator-color') get cssIndicator(): string {
    return `var(--sd-${this.color()})`;
  }
  @HostBinding('style.--sd-tab-label-active-color') get cssActive(): string {
    return `var(--sd-${this.color()})`;
  }
  @HostBinding('style.--sd-tab-badge-bg') get cssBadgeBg(): string {
    return `var(--sd-${this.color()}-light)`;
  }
  @HostBinding('style.--sd-tab-badge-color') get cssBadgeColor(): string {
    return `var(--sd-${this.color()})`;
  }

  constructor() {
    // why: Material không có input style cho hai vùng; chỉ chọn con trực tiếp để không chạm group lồng nhau.
    afterRenderEffect(onCleanup => {
      const element = this.matTabElement()?.nativeElement;
      const headerClass = this.headerClass();
      const headerStyle = this.headerStyle();
      const bodyClass = this.bodyClass();
      const bodyStyle = this.bodyStyle();
      if (!element) return;
      const restoreHeader = this.#customizeRegion(element.querySelector(':scope > mat-tab-header'), headerClass, headerStyle);
      const restoreBody = this.#customizeRegion(element.querySelector(':scope > .mat-mdc-tab-body-wrapper'), bodyClass, bodyStyle);
      onCleanup(() => {
        restoreHeader();
        restoreBody();
      });
    });
    // why: when the active tab is removed (e.g. parent splices the tabs array),
    // selectedIndex may point past the end. Clamp it back to the last valid index
    // so MatTabGroup doesn't render with a stale selection.
    effect(() => {
      const len = this.tabs().length;
      const cur = untracked(() => this.selectedIndex());
      if (len > 0 && cur >= len) {
        this.selectedIndex.set(Math.max(0, len - 1));
      }
    });
  }

  #customizeRegion(
    element: HTMLElement | null,
    classes: string | null | undefined,
    styles: SdTabRegionStyle | null | undefined
  ): () => void {
    if (!element) return () => {};
    const addedClasses = [...new Set(classes?.split(/\s+/).filter(Boolean) ?? [])].filter(name => !element.classList.contains(name));
    addedClasses.forEach(name => element.classList.add(name));
    const previousStyles = new Map<string, { value: string; priority: string }>();
    for (const [key, value] of Object.entries(styles ?? {})) {
      if (value == null) continue;
      const property = key.startsWith('--') ? key : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      if (!previousStyles.has(property)) {
        previousStyles.set(property, {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
        });
      }
      element.style.setProperty(property, String(value));
    }
    return () => {
      addedClasses.forEach(name => element.classList.remove(name));
      for (const [property, previous] of previousStyles) {
        if (previous.value) element.style.setProperty(property, previous.value, previous.priority);
        else element.style.removeProperty(property);
      }
    };
  }

  selectTab(index: number): void {
    const len = this.tabs().length;
    if (len === 0) {
      this.selectedIndex.set(0);
      return;
    }
    this.selectedIndex.set(Math.max(0, Math.min(index, len - 1)));
  }

  realignInkBar(): void {
    this.matTabGroup()?.realignInkBar();
  }

  protected onClose(tab: SdTab, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (tab.disabled()) return;
    if (!tab.beforeClose()) {
      tab.forceClose();
      this.tabClosed.emit({ index, tab });
      return;
    }
    if (this.#closeRequests.has(tab)) return;

    const request = tab.requestClose();
    this.#closeRequests.set(tab, request);
    void request.then(closed => {
      if (closed) this.tabClosed.emit({ index, tab });
    });
    void request.finally(() => this.#closeRequests.delete(tab));
  }
}
