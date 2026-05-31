import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  effect,
  HostBinding,
  input,
  model,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { SdBaseSecureComponent } from '@sdcorejs/angular/components/base';
import { Color } from '@sdcorejs/utils/models';
import { SdTab } from './tab.component';

export interface SdTabClosedEvent {
  index: number;
  tab: SdTab;
}

@Component({
  selector: 'sd-tab-group',
  standalone: true,
  imports: [MatTabsModule, MatIconModule, NgTemplateOutlet],
  templateUrl: './tab-group.component.html',
  styleUrls: ['./tab-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTabGroup extends SdBaseSecureComponent {
  tabs = contentChildren(SdTab);

  selectedIndex = model<number>(0);
  // why: visual style preset. 'line' = Material default (underline ink-bar);
  // 'pills' = rounded pill, active filled (good for nested tab groups + filter bars);
  // 'segmented' = single bordered container, iOS-style.
  variant = input<'line' | 'pills' | 'segmented'>('line');
  // why: drives the active/indicator color via Core CSS vars (--sd-<color>, --sd-<color>-light).
  // Same palette consumers use on <sd-badge>, <sd-button>, etc — keeps theming consistent.
  color = input<Color>('primary');
  headerPosition = input<'above' | 'below'>('above');
  alignTabs = input<'start' | 'center' | 'end'>('start');
  // why: mat-tab-group defaults stretchTabs=true, which makes labels fill the row
  // and overrides alignTabs. Expose this so consumers can opt out and let alignTabs take effect.
  stretchTabs = input(true, { transform: booleanAttribute });
  animationDuration = input<string>('500ms');
  disableRipple = input(false, { transform: booleanAttribute });
  dynamicHeight = input(false, { transform: booleanAttribute });
  autoId = input<string | undefined>(undefined);

  tabClosed = output<SdTabClosedEvent>();

  protected matTabGroup = viewChild(MatTabGroup);

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
    super();
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
    tab.close.emit();
    this.tabClosed.emit({ index, tab });
  }
}
