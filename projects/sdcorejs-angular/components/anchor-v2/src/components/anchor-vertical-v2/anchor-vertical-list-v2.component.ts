import { ChangeDetectionStrategy, Component, OnDestroy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { SdAnchorItemV2 } from '../anchor-item-v2/anchor-item-v2.component';

@Component({
  selector: 'sd-anchor-vertical-list-v2',
  templateUrl: './anchor-vertical-list-v2.component.html',
  styleUrl: './anchor-vertical-list-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  standalone: true,
})
export class SdAnchorVerticalListV2 implements OnDestroy {
  sections = input.required<readonly SdAnchorItemV2[]>();
  activeSectionId = input<string>('');
  ellipsis = input<boolean>(false);
  sidebarWidth = input<string>('');

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
