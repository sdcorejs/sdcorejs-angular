import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTabInfo, SdTabRouterTab } from '../../models';
import { SdTabInfoPipe } from '../../pipes/tab-info.pipe';

let nextId = 0;

/** Một hàng của menu danh sách tab (đợt 3 · 3b): icon, tên và nút đóng hiện khi hover. Nội bộ, không export. */
@Component({
  selector: 'sd-tab-router-list-item',
  templateUrl: './tab-router-list-item.component.html',
  styleUrl: './tab-router-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, SdTabInfoPipe, SdTranslatePipe],
  host: {
    role: 'listitem',
    class: 'tab-router__menu-row',
    '[class.tab-router__menu-row--active]': 'tab().isActive',
  },
})
export class SdTabRouterListItemComponent implements OnInit {
  readonly #destroyRef = inject(DestroyRef);

  readonly tab = input.required<SdTabRouterTab>();
  /** Bấm vào tên: chuyển sang tab này. */
  readonly pick = output<void>();
  /** Bấm nút đóng: đóng tab này. */
  readonly closeTab = output<void>();

  readonly tabInfo = signal<SdTabInfo | null>(null);
  readonly nameId = `sd-tab-router-list-item-${nextId++}`;

  ngOnInit(): void {
    // why: outlet tạo `tabInfoChanges` là ReplaySubject(1), nên hàng dựng lúc menu mở vẫn nhận tên đã gửi trước đó.
    const subscription = this.tab().tabInfoChanges.subscribe(info => this.tabInfo.set(info));
    this.#destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
