import { ChangeDetectionStrategy, Component, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { SdAnchorItem } from '../anchor-item/anchor-item.component';

@Component({
  selector: 'sd-anchor-vertical-list',
  templateUrl: './anchor-vertical-list.component.html',
  styleUrl: './anchor-vertical-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  standalone: true,
})
export class SdAnchorVerticalList implements OnDestroy {
  sections = input.required<readonly SdAnchorItem[]>();
  activeSectionId = input<string>('');
  ellipsis = input<boolean>(false);
  sidebarWidth = input<string>('');
  // autoId được forward từ <sd-anchor>. Derive per-item autoId theo `key` của item (nếu có).
  parentAutoId = input<string | undefined | null>(undefined);

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
      this.#clickSectionSubject
        .pipe(debounceTime(this.#delay))
        .subscribe((id: string) => this.sdClickSection.emit(id))
    );
  }

  onClickSection = (id: string): void => {
    this.#clickSectionSubject.next(id);
  };

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }
}
