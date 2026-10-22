import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdTabRouterTab, SdTabInfo } from '../../models';
import { SdTabRouterService } from '../../services/tab-router.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SdTabInfoPipe } from '../../pipes/tab-info.pipe';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';

@Component({
  selector: 'sd-tab-router-item',
  templateUrl: './tab-router-item.component.html',
  styleUrl: './tab-router-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SdIcon, CommonModule, SdTabInfoPipe, SdTooltipDirective, SdTranslatePipe],
  host: {
    // why: nav cần biết tab nào đang mở trên chính phần tử host để ẩn vạch ngăn ở hai bên nó.
    '[class.sd-tab-router-item--active]': 'tab.isActive',
  },
})
export class SdTabRouterItemComponent implements OnInit, OnDestroy {
  private cdRef = inject(ChangeDetectorRef);
  private tabRouterService = inject(SdTabRouterService);
  private router = inject(Router);

  @Input({ required: true }) tab!: SdTabRouterTab;

  #subscription: Subscription = new Subscription();
  tabInfo?: SdTabInfo;

  private readonly nameRef = viewChild<ElementRef<HTMLElement>>('name');
  readonly #truncated = signal(false);
  /** Tên tab đang bị cắt (ellipsis): chỉ khi đó tooltip mới lặp lại tên. */
  readonly truncated = this.#truncated.asReadonly();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.#subscription.add(
      this.tabRouterService.events.pipe(debounceTime(100)).subscribe(() => {
        this.cdRef.markForCheck();
      })
    );

    this.#subscription.add(
      this.tab.tabInfoChanges.pipe(startWith(null)).subscribe(tabInfo => {
        if (tabInfo) {
          this.tabInfo = tabInfo;
          this.cdRef.markForCheck();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  // why: đo lúc chuột vào hoặc focus tới, không đo theo resize — tooltip chỉ cần biết vào đúng lúc nó sắp hiện.
  measureTruncation = (): void => {
    const el = this.nameRef()?.nativeElement;
    this.#truncated.set(!!el && el.scrollWidth > el.clientWidth);
  };

  onTabClick = (event: Event) => {
    event.preventDefault();
    this.router.navigate([this.tab.url], {
      queryParams: this.tab.queryParams,
      state: { switchTab: true },
    });
  };

  close = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.#closeTab();
  };

  onMousedown = (event: MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  };

  onMouseup = (event: MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      this.#closeTab();
    }
  };

  #closeTab = () => {
    this.tabRouterService.close(this.tab);
  };
}
