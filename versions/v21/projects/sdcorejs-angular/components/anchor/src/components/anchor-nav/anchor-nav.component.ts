import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Color } from '@sdcorejs/utils/models';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { SdAnchorItem } from '../anchor-item/anchor-item.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'anchor-nav',
  templateUrl: './anchor-nav.component.html',
  styleUrl: './anchor-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, CommonModule],
  standalone: true,
})
export class AnchorNav implements OnDestroy {
  sections = input.required<readonly SdAnchorItem[]>();
  activeSectionId = input<string>('');
  ellipsis = input<boolean>(false);
  sidebarWidth = input<string>('');
  // autoId được forward từ <sd-anchor>. Derive per-item autoId theo `key` của item (nếu có).
  parentAutoId = input<string | undefined | null>(undefined);
  color = input<Color>('primary');

  // CSS var binding cho active state — map Color → global token `--sd-{color}`.
  // SCSS đọc qua `var(--anchor-active-color)` cho border + text + icon.
  cssActiveVar = computed(() => `var(--sd-${this.color()})`);

  itemAutoId(section: SdAnchorItem): string | undefined {
    const parent = this.parentAutoId();
    const key = section.key();
    return parent && key ? `${parent}-${key}` : undefined;
  }

  sdClickSection = output<string>();

  #delay = 200;
  #clickSectionSubject = new Subject<string>();
  #subscription = new Subscription();

  constructor() {
    this.#subscription.add(
      this.#clickSectionSubject.pipe(debounceTime(this.#delay)).subscribe((id: string) => this.sdClickSection.emit(id))
    );
  }

  onClickSection = (id: string): void => {
    this.#clickSectionSubject.next(id);
  };

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
